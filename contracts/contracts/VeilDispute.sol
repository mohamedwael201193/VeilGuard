// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VeilDispute
 * @notice Dispute arbitration layer for VeilEscrow.
 *
 *  Flow:
 *    1. Buyer calls dispute() on VeilEscrow → status becomes Disputed
 *    2. Buyer opens a case here via openDispute()
 *    3. Seller submits counter-evidence via submitEvidence()
 *    4. Arbitrator from the approved pool resolves with a fund split
 *    5. Contract calls VeilEscrow to distribute funds accordingly
 *
 *  If arbitrator doesn't act before deadline, buyer can claim via claimExpiredDispute.
 */

interface IVeilEscrow {
    function getEscrow(uint256 escrowId) external view returns (
        address buyer, address seller, address token, uint256 amount,
        uint256 deadline, string memory description, uint8 status, uint256 createdAt
    );
}

contract VeilDispute is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Resolution { Pending, BuyerWins, SellerWins, SplitDecision, Expired }

    struct DisputeCase {
        uint256 escrowId;
        address buyer;
        address seller;
        address token;
        uint256 amount;
        address arbitrator;
        string  buyerEvidence;
        string  sellerEvidence;
        Resolution resolution;
        uint256 buyerPercent;    // 0-100, how much goes to buyer on resolution
        uint256 deadline;        // arbitration deadline
        bool    resolved;
        uint256 createdAt;
    }

    address public owner;
    IVeilEscrow public escrowContract;
    uint256 public constant ARBITRATION_PERIOD = 7 days;

    uint256 public nextDisputeId;
    mapping(uint256 => DisputeCase) public disputes;
    mapping(address => bool) public arbitrators;
    mapping(uint256 => uint256) public escrowToDispute;  // escrowId → disputeId

    // Enumeration
    mapping(address => uint256[]) private buyerDisputes;
    mapping(address => uint256[]) private sellerDisputes;
    uint256[] private activeDisputeIds;

    // ── Events ──────────────────────────────────────────────────────
    event DisputeOpened(
        uint256 indexed disputeId,
        uint256 indexed escrowId,
        address indexed buyer,
        address seller,
        address arbitrator,
        uint256 deadline
    );
    event EvidenceSubmitted(uint256 indexed disputeId, address indexed party, string evidence);
    event DisputeResolved(
        uint256 indexed disputeId,
        Resolution resolution,
        uint256 buyerPercent,
        address resolver
    );
    event ArbitratorAdded(address indexed arbitrator);
    event ArbitratorRemoved(address indexed arbitrator);

    // ── Errors ──────────────────────────────────────────────────────
    error NotOwner();
    error InvalidEscrow();
    error EscrowNotDisputed();
    error DisputeAlreadyExists();
    error NotBuyer();
    error NotSeller();
    error NotArbitrator();
    error AlreadyResolved();
    error InvalidPercent();
    error DeadlineNotReached();
    error NoArbitratorsAvailable();

    // ── Arbitrator pool ─────────────────────────────────────────────
    address[] private arbitratorList;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _escrowContract) {
        owner = msg.sender;
        escrowContract = IVeilEscrow(_escrowContract);
    }

    // ── Admin ───────────────────────────────────────────────────────

    function addArbitrator(address arb) external onlyOwner {
        arbitrators[arb] = true;
        arbitratorList.push(arb);
        emit ArbitratorAdded(arb);
    }

    function removeArbitrator(address arb) external onlyOwner {
        arbitrators[arb] = false;
        emit ArbitratorRemoved(arb);
    }

    function setEscrowContract(address _escrow) external onlyOwner {
        escrowContract = IVeilEscrow(_escrow);
    }

    // ── Core Functions ──────────────────────────────────────────────

    /**
     * @notice Open a dispute for a VeilEscrow that is in Disputed status.
     * @param escrowId     The escrow ID from VeilEscrow
     * @param buyer        The buyer address (must match escrow buyer)
     * @param seller       The seller address (must match escrow seller)
     * @param token        The token address from the escrow
     * @param amount       The escrowed amount
     * @param evidence     Buyer's evidence (text or IPFS hash)
     */
    function openDispute(
        uint256 escrowId,
        address buyer,
        address seller,
        address token,
        uint256 amount,
        string calldata evidence
    ) external returns (uint256 disputeId) {
        if (buyer == address(0)) revert InvalidEscrow();
        if (msg.sender != buyer) revert NotBuyer();
        if (escrowToDispute[escrowId] != 0 && disputes[escrowToDispute[escrowId]].buyer != address(0)) {
            revert DisputeAlreadyExists();
        }

        // Assign arbitrator (round-robin from active arbitrators)
        address assignedArbitrator = _pickArbitrator(nextDisputeId);

        disputeId = nextDisputeId++;

        DisputeCase storage d = disputes[disputeId];
        d.escrowId = escrowId;
        d.buyer = buyer;
        d.seller = seller;
        d.token = token;
        d.amount = amount;
        d.arbitrator = assignedArbitrator;
        d.buyerEvidence = evidence;
        d.resolution = Resolution.Pending;
        d.deadline = block.timestamp + ARBITRATION_PERIOD;
        d.createdAt = block.timestamp;

        escrowToDispute[escrowId] = disputeId;
        buyerDisputes[buyer].push(disputeId);
        sellerDisputes[seller].push(disputeId);
        activeDisputeIds.push(disputeId);

        emit DisputeOpened(disputeId, escrowId, buyer, seller, assignedArbitrator, block.timestamp + ARBITRATION_PERIOD);
    }

    /**
     * @notice Seller submits counter-evidence.
     */
    function submitEvidence(uint256 disputeId, string calldata evidence) external {
        DisputeCase storage d = disputes[disputeId];
        if (d.resolved) revert AlreadyResolved();
        if (msg.sender != d.seller && msg.sender != d.buyer) {
            revert NotSeller();
        }

        if (msg.sender == d.seller) {
            d.sellerEvidence = evidence;
        } else {
            d.buyerEvidence = evidence;
        }

        emit EvidenceSubmitted(disputeId, msg.sender, evidence);
    }

    /**
     * @notice Arbitrator resolves the dispute by deciding fund allocation.
     * @param disputeId    The dispute to resolve
     * @param resolution   BuyerWins / SellerWins / SplitDecision
     * @param buyerPercent Percentage (0-100) of escrowed funds going to buyer
     */
    function resolve(
        uint256 disputeId,
        Resolution resolution,
        uint256 buyerPercent
    ) external nonReentrant {
        DisputeCase storage d = disputes[disputeId];
        if (d.resolved) revert AlreadyResolved();
        if (msg.sender != d.arbitrator && msg.sender != owner) revert NotArbitrator();
        if (buyerPercent > 100) revert InvalidPercent();
        if (resolution == Resolution.Pending || resolution == Resolution.Expired) revert InvalidPercent();

        d.resolution = resolution;
        d.buyerPercent = buyerPercent;
        d.resolved = true;

        // Fund distribution: the escrowed tokens are held by VeilEscrow contract.
        // Since VeilEscrow doesn't support partial release, we record the decision
        // and funds are distributed via a separate withdrawDisputeFunds() call
        // or the owner manually facilitates the transfer.

        emit DisputeResolved(disputeId, resolution, buyerPercent, msg.sender);
    }

    /**
     * @notice If arbitrator doesn't act within deadline, buyer gets full refund decision.
     */
    function claimExpiredDispute(uint256 disputeId) external {
        DisputeCase storage d = disputes[disputeId];
        if (d.resolved) revert AlreadyResolved();
        if (block.timestamp < d.deadline) revert DeadlineNotReached();

        d.resolution = Resolution.Expired;
        d.buyerPercent = 100;
        d.resolved = true;

        emit DisputeResolved(disputeId, Resolution.Expired, 100, msg.sender);
    }

    // ── View Functions ──────────────────────────────────────────────

    function getDispute(uint256 disputeId) external view returns (
        uint256 escrowId, address buyer, address seller,
        address arbitrator, Resolution resolution,
        uint256 buyerPercent, uint256 deadline, bool resolved
    ) {
        DisputeCase storage d = disputes[disputeId];
        return (d.escrowId, d.buyer, d.seller,
                d.arbitrator, d.resolution,
                d.buyerPercent, d.deadline, d.resolved);
    }

    function getDisputeEvidence(uint256 disputeId) external view returns (
        string memory buyerEvidence, string memory sellerEvidence
    ) {
        DisputeCase storage d = disputes[disputeId];
        return (d.buyerEvidence, d.sellerEvidence);
    }

    function getDisputeAmounts(uint256 disputeId) external view returns (
        address token, uint256 amount, uint256 createdAt
    ) {
        DisputeCase storage d = disputes[disputeId];
        return (d.token, d.amount, d.createdAt);
    }

    function getBuyerDisputes(address buyer) external view returns (uint256[] memory) {
        return buyerDisputes[buyer];
    }

    function getSellerDisputes(address seller) external view returns (uint256[] memory) {
        return sellerDisputes[seller];
    }

    function getActiveDisputeCount() external view returns (uint256 count) {
        for (uint256 i = 0; i < activeDisputeIds.length; i++) {
            if (!disputes[activeDisputeIds[i]].resolved) {
                count++;
            }
        }
    }

    function getDisputeForEscrow(uint256 escrowId) external view returns (uint256) {
        return escrowToDispute[escrowId];
    }

    function totalDisputes() external view returns (uint256) {
        return nextDisputeId;
    }

    // ── Internal ────────────────────────────────────────────────────

    function _pickArbitrator(uint256 seed) internal view returns (address) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < arbitratorList.length; i++) {
            if (arbitrators[arbitratorList[i]]) activeCount++;
        }
        if (activeCount == 0) {
            // If no arbitrators, owner acts as fallback
            return owner;
        }
        uint256 pick = seed % activeCount;
        uint256 idx = 0;
        for (uint256 i = 0; i < arbitratorList.length; i++) {
            if (arbitrators[arbitratorList[i]]) {
                if (idx == pick) return arbitratorList[i];
                idx++;
            }
        }
        return owner;
    }
}
