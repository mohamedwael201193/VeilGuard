// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VeilBatchProcessor
 * @notice Gas-efficient batch operations for VeilGuard.
 *
 *  Replaces the frontend's sequential writeContract loop with
 *  single-tx multicalls for:
 *    - Multi-recipient token transfers (payroll, airdrops)
 *    - Batch invoice payments
 *
 *  Gas savings: ~30-40% vs individual transactions (shared base tx cost).
 */
contract VeilBatchProcessor is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public owner;

    // ── Events ──────────────────────────────────────────────────────
    event BatchTransferExecuted(
        address indexed sender,
        address token,
        uint256 totalAmount,
        uint256 recipientCount
    );
    event BatchPaymentExecuted(
        address indexed payer,
        address token,
        uint256 totalAmount,
        uint256 invoiceCount
    );

    // ── Errors ──────────────────────────────────────────────────────
    error InvalidToken();
    error EmptyBatch();
    error LengthMismatch();
    error ZeroAmount();
    error InvalidRecipient();
    error TooManyItems();
    error NotOwner();

    uint256 public constant MAX_BATCH_SIZE = 100;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ── Core Functions ──────────────────────────────────────────────

    /**
     * @notice Transfer tokens to multiple recipients in a single transaction.
     * @dev Caller must approve totalAmount to this contract first.
     * @param token       ERC-20 token address
     * @param recipients  Array of recipient addresses
     * @param amounts     Array of amounts for each recipient
     */
    function batchTransfer(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external nonReentrant {
        if (token == address(0)) revert InvalidToken();
        if (recipients.length == 0) revert EmptyBatch();
        if (recipients.length != amounts.length) revert LengthMismatch();
        if (recipients.length > MAX_BATCH_SIZE) revert TooManyItems();

        uint256 total = 0;
        IERC20 tokenContract = IERC20(token);

        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert InvalidRecipient();
            if (amounts[i] == 0) revert ZeroAmount();
            total += amounts[i];
            tokenContract.safeTransferFrom(msg.sender, recipients[i], amounts[i]);
        }

        emit BatchTransferExecuted(msg.sender, token, total, recipients.length);
    }

    /**
     * @notice Pay multiple invoice stealth addresses in one transaction.
     * @dev Specialised version of batchTransfer with invoice-specific event.
     * @param token            ERC-20 token address
     * @param stealthAddresses Array of stealth payment addresses
     * @param amounts          Array of amounts per invoice
     */
    function batchPayInvoices(
        address token,
        address[] calldata stealthAddresses,
        uint256[] calldata amounts
    ) external nonReentrant {
        if (token == address(0)) revert InvalidToken();
        if (stealthAddresses.length == 0) revert EmptyBatch();
        if (stealthAddresses.length != amounts.length) revert LengthMismatch();
        if (stealthAddresses.length > MAX_BATCH_SIZE) revert TooManyItems();

        uint256 total = 0;
        IERC20 tokenContract = IERC20(token);

        for (uint256 i = 0; i < stealthAddresses.length; i++) {
            if (stealthAddresses[i] == address(0)) revert InvalidRecipient();
            if (amounts[i] == 0) revert ZeroAmount();
            total += amounts[i];
            tokenContract.safeTransferFrom(msg.sender, stealthAddresses[i], amounts[i]);
        }

        emit BatchPaymentExecuted(msg.sender, token, total, stealthAddresses.length);
    }

    /**
     * @notice Estimate total amount needed for a batch (view helper).
     */
    function estimateTotal(uint256[] calldata amounts) external pure returns (uint256 total) {
        for (uint256 i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }
    }
}
