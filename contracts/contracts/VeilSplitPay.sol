// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VeilSplitPay
 * @notice Single-transaction payment splitting for VeilGuard.
 *
 *  Use cases:
 *    - Group invoice splitting (shared expenses)
 *    - Payroll (pay N employees in one tx)
 *    - Revenue sharing (automatic percentage splits)
 *    - Airdrop distribution
 *
 *  Flow:
 *    1. Creator defines recipients + amounts
 *    2. Payer approves total amount to this contract
 *    3. Payer calls executeSplit() → all transfers happen atomically
 */
contract VeilSplitPay is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Split {
        bytes32  invoiceId;      // optional link to InvoiceRegistry
        address  token;
        address  payer;
        address[] recipients;
        uint256[] amounts;
        uint256  totalAmount;
        bool     executed;
        string   memo;
        uint256  createdAt;
    }

    uint256 public nextSplitId;
    mapping(uint256 => Split) private splits;
    mapping(address => uint256[]) private payerSplits;

    // ── Events ──────────────────────────────────────────────────────
    event SplitCreated(
        uint256 indexed splitId,
        address indexed payer,
        address token,
        uint256 totalAmount,
        uint256 recipientCount,
        string  memo
    );
    event SplitExecuted(
        uint256 indexed splitId,
        address indexed payer,
        uint256 totalAmount
    );

    // ── Errors ──────────────────────────────────────────────────────
    error InvalidToken();
    error EmptyRecipients();
    error LengthMismatch();
    error ZeroAmount();
    error InvalidRecipient();
    error AlreadyExecuted();
    error NotPayer();
    error TooManyRecipients();

    uint256 public constant MAX_RECIPIENTS = 50;

    // ── Core Functions ──────────────────────────────────────────────

    /**
     * @notice Create a split payment definition.
     * @param invoiceId   Optional invoice ID (bytes32(0) if standalone)
     * @param token       ERC-20 token address
     * @param recipients  Array of recipient addresses
     * @param amounts     Array of amounts corresponding to each recipient
     * @param memo        Description of the split
     * @return splitId    The ID of the created split
     */
    function createSplit(
        bytes32 invoiceId,
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts,
        string calldata memo
    ) external returns (uint256 splitId) {
        if (token == address(0)) revert InvalidToken();
        if (recipients.length == 0) revert EmptyRecipients();
        if (recipients.length != amounts.length) revert LengthMismatch();
        if (recipients.length > MAX_RECIPIENTS) revert TooManyRecipients();

        uint256 total = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert InvalidRecipient();
            if (amounts[i] == 0) revert ZeroAmount();
            total += amounts[i];
        }

        splitId = nextSplitId++;

        Split storage s = splits[splitId];
        s.invoiceId = invoiceId;
        s.token = token;
        s.payer = msg.sender;
        s.recipients = recipients;
        s.amounts = amounts;
        s.totalAmount = total;
        s.executed = false;
        s.memo = memo;
        s.createdAt = block.timestamp;

        payerSplits[msg.sender].push(splitId);

        emit SplitCreated(splitId, msg.sender, token, total, recipients.length, memo);
    }

    /**
     * @notice Execute a split payment. Payer must have approved totalAmount to this contract.
     * @param splitId The split to execute
     */
    function executeSplit(uint256 splitId) external nonReentrant {
        Split storage s = splits[splitId];
        if (s.executed) revert AlreadyExecuted();
        if (msg.sender != s.payer) revert NotPayer();

        s.executed = true;

        IERC20 token = IERC20(s.token);
        for (uint256 i = 0; i < s.recipients.length; i++) {
            token.safeTransferFrom(s.payer, s.recipients[i], s.amounts[i]);
        }

        emit SplitExecuted(splitId, s.payer, s.totalAmount);
    }

    /**
     * @notice Create and execute in a single transaction for convenience.
     */
    function createAndExecute(
        bytes32 invoiceId,
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts,
        string calldata memo
    ) external nonReentrant returns (uint256 splitId) {
        if (token == address(0)) revert InvalidToken();
        if (recipients.length == 0) revert EmptyRecipients();
        if (recipients.length != amounts.length) revert LengthMismatch();
        if (recipients.length > MAX_RECIPIENTS) revert TooManyRecipients();

        uint256 total = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert InvalidRecipient();
            if (amounts[i] == 0) revert ZeroAmount();
            total += amounts[i];
        }

        splitId = nextSplitId++;

        Split storage s = splits[splitId];
        s.invoiceId = invoiceId;
        s.token = token;
        s.payer = msg.sender;
        s.recipients = recipients;
        s.amounts = amounts;
        s.totalAmount = total;
        s.executed = true;
        s.memo = memo;
        s.createdAt = block.timestamp;

        payerSplits[msg.sender].push(splitId);

        IERC20 tokenContract = IERC20(token);
        for (uint256 i = 0; i < recipients.length; i++) {
            tokenContract.safeTransferFrom(msg.sender, recipients[i], amounts[i]);
        }

        emit SplitCreated(splitId, msg.sender, token, total, recipients.length, memo);
        emit SplitExecuted(splitId, msg.sender, total);
    }

    // ── View Functions ──────────────────────────────────────────────

    function getSplit(uint256 splitId) external view returns (
        bytes32 invoiceId, address token, address payer,
        address[] memory recipients, uint256[] memory amounts,
        uint256 totalAmount, bool executed, string memory memo, uint256 createdAt
    ) {
        Split storage s = splits[splitId];
        return (s.invoiceId, s.token, s.payer, s.recipients, s.amounts,
                s.totalAmount, s.executed, s.memo, s.createdAt);
    }

    function getPayerSplits(address payer) external view returns (uint256[] memory) {
        return payerSplits[payer];
    }

    function totalSplits() external view returns (uint256) {
        return nextSplitId;
    }
}
