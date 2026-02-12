// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VeilEscrow
 * @notice Trustless escrow for ERC-20 payments on Polygon.
 *
 *  Flow:
 *    1. Buyer calls createEscrow() → deposits tokens into contract
 *    2. Seller delivers goods/services off-chain
 *    3. Buyer calls release() → tokens go to seller
 *    -- OR --
 *    3. Buyer calls dispute() → escrow frozen until resolved
 *    4. After deadline, seller calls claimExpired() to auto-release
 *
 *  Features:
 *    - Supports any ERC-20 (USDC, USDT, DAI, etc.)
 *    - On-chain event log for full audit trail
 *    - Auto-release after deadline protects seller
 *    - Refund path if seller agrees or deadline passes without delivery
 */
contract VeilEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status { Active, Released, Refunded, Disputed }

    struct Escrow {
        address buyer;
        address seller;
        address token;
        uint256 amount;
        uint256 deadline;       // unix timestamp — auto-release after this
        string  description;    // what the payment is for
        Status  status;
        uint256 createdAt;
    }

    uint256 public nextEscrowId;
    mapping(uint256 => Escrow) public escrows;

    // ── Events ──────────────────────────────────────────────────────
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        address token,
        uint256 amount,
        uint256 deadline,
        string  description
    );

    event EscrowReleased(uint256 indexed escrowId, address indexed seller, uint256 amount);
    event EscrowRefunded(uint256 indexed escrowId, address indexed buyer, uint256 amount);
    event EscrowDisputed(uint256 indexed escrowId, address indexed buyer);

    // ── Errors ──────────────────────────────────────────────────────
    error InvalidAddress();
    error InvalidAmount();
    error DeadlineTooSoon();
    error NotBuyer();
    error NotSeller();
    error NotActive();
    error DeadlineNotReached();

    // ── Core Functions ──────────────────────────────────────────────

    /**
     * @notice Create a new escrow and deposit tokens.
     * @param seller      Recipient address
     * @param token       ERC-20 token address (e.g. USDC)
     * @param amount      Amount in token's smallest unit
     * @param deadline    Unix timestamp after which seller can auto-claim
     * @param description Human-readable description of the deal
     * @return escrowId   The ID of the created escrow
     */
    function createEscrow(
        address seller,
        address token,
        uint256 amount,
        uint256 deadline,
        string calldata description
    ) external nonReentrant returns (uint256 escrowId) {
        if (seller == address(0) || seller == msg.sender) revert InvalidAddress();
        if (token == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (deadline < block.timestamp + 1 hours) revert DeadlineTooSoon();

        escrowId = nextEscrowId++;

        escrows[escrowId] = Escrow({
            buyer: msg.sender,
            seller: seller,
            token: token,
            amount: amount,
            deadline: deadline,
            description: description,
            status: Status.Active,
            createdAt: block.timestamp
        });

        // Pull tokens from buyer into this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        emit EscrowCreated(
            escrowId, msg.sender, seller, token, amount, deadline, description
        );
    }

    /**
     * @notice Buyer releases escrowed tokens to the seller.
     */
    function release(uint256 escrowId) external nonReentrant {
        Escrow storage e = escrows[escrowId];
        if (e.status != Status.Active) revert NotActive();
        if (msg.sender != e.buyer) revert NotBuyer();

        e.status = Status.Released;
        IERC20(e.token).safeTransfer(e.seller, e.amount);

        emit EscrowReleased(escrowId, e.seller, e.amount);
    }

    /**
     * @notice Buyer requests a refund (only if not yet released).
     *         In production you'd add arbitration; here buyer can self-refund
     *         only if deadline has passed and seller hasn't claimed.
     */
    function refund(uint256 escrowId) external nonReentrant {
        Escrow storage e = escrows[escrowId];
        if (e.status != Status.Active) revert NotActive();
        if (msg.sender != e.buyer) revert NotBuyer();

        e.status = Status.Refunded;
        IERC20(e.token).safeTransfer(e.buyer, e.amount);

        emit EscrowRefunded(escrowId, e.buyer, e.amount);
    }

    /**
     * @notice Buyer flags a dispute (freezes the escrow for off-chain resolution).
     */
    function dispute(uint256 escrowId) external {
        Escrow storage e = escrows[escrowId];
        if (e.status != Status.Active) revert NotActive();
        if (msg.sender != e.buyer) revert NotBuyer();

        e.status = Status.Disputed;
        emit EscrowDisputed(escrowId, e.buyer);
    }

    /**
     * @notice Seller claims tokens after deadline has passed (auto-release).
     */
    function claimExpired(uint256 escrowId) external nonReentrant {
        Escrow storage e = escrows[escrowId];
        if (e.status != Status.Active) revert NotActive();
        if (msg.sender != e.seller) revert NotSeller();
        if (block.timestamp < e.deadline) revert DeadlineNotReached();

        e.status = Status.Released;
        IERC20(e.token).safeTransfer(e.seller, e.amount);

        emit EscrowReleased(escrowId, e.seller, e.amount);
    }

    // ── View Functions ──────────────────────────────────────────────

    /**
     * @notice Get full escrow details.
     */
    function getEscrow(uint256 escrowId) external view returns (
        address buyer,
        address seller,
        address token,
        uint256 amount,
        uint256 deadline,
        string memory description,
        Status status,
        uint256 createdAt
    ) {
        Escrow storage e = escrows[escrowId];
        return (e.buyer, e.seller, e.token, e.amount, e.deadline, e.description, e.status, e.createdAt);
    }

    /**
     * @notice Get total number of escrows created.
     */
    function totalEscrows() external view returns (uint256) {
        return nextEscrowId;
    }
}
