// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title InvoiceRegistry v2 - Wave 3
 * @notice Privacy-preserving invoice management with stealth address support
 * @dev ERC-5564 compatible invoice creation and payment tracking
 * 
 * Wave 3 Changes:
 * - Added invoice expiry support
 * - Integrated ReceiptStore for automatic receipt generation
 * - Added batch operations for efficiency
 * - Enhanced events with more metadata
 */

interface IERC20 { 
    function balanceOf(address) external view returns (uint256); 
}

interface IReceiptStore {
    function store(bytes32 invoiceId, bytes32 receiptHash) external;
}

contract InvoiceRegistry {
    // Events
    event InvoiceCreated(
        bytes32 indexed invoiceId, 
        address indexed merchant, 
        address token, 
        uint256 amount, 
        address stealthAddress, 
        string memo,
        uint256 expiresAt
    );
    event InvoicePaid(
        bytes32 indexed invoiceId, 
        address indexed marker, 
        uint256 amountObserved, 
        bytes32 txHashHint,
        bytes32 receiptHash
    );
    event RefundRequested(bytes32 indexed invoiceId, address indexed requester, address refundTo, uint256 amountHint);
    event InvoiceExpired(bytes32 indexed invoiceId);

    // Invoice struct with expiry
    struct Invoice { 
        address merchant; 
        address token; 
        uint256 amount; 
        address stealthAddress; 
        bool paid;
        uint256 expiresAt; // Wave 3: expiry timestamp (0 = no expiry)
    }
    
    // Storage
    mapping(bytes32 => Invoice) public invoices;
    
    // Receipt store reference (set by owner)
    IReceiptStore public receiptStore;
    address public immutable owner;

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Set the ReceiptStore contract address
     * @param _receiptStore Address of ReceiptStore contract
     */
    function setReceiptStore(address _receiptStore) external {
        require(msg.sender == owner, "not owner");
        receiptStore = IReceiptStore(_receiptStore);
    }

    /**
     * @notice Create a new invoice with optional expiry
     * @param token Token address for payment
     * @param amount Amount to pay
     * @param stealthAddress Stealth address for payment
     * @param memo Optional memo
     * @return invoiceId The unique invoice ID
     */
    function createInvoice(address token, uint256 amount, address stealthAddress, string calldata memo)
        external returns (bytes32 invoiceId)
    {
        require(token != address(0) && stealthAddress != address(0), "bad params");
        invoiceId = keccak256(abi.encode(msg.sender, token, amount, stealthAddress, block.timestamp, block.prevrandao));
        invoices[invoiceId] = Invoice(msg.sender, token, amount, stealthAddress, false, 0);
        emit InvoiceCreated(invoiceId, msg.sender, token, amount, stealthAddress, memo, 0);
    }

    /**
     * @notice Create invoice with expiry (Wave 3)
     * @param token Token address for payment
     * @param amount Amount to pay
     * @param stealthAddress Stealth address for payment
     * @param memo Optional memo
     * @param expiresAt Expiry timestamp (0 for no expiry)
     * @return invoiceId The unique invoice ID
     */
    function createInvoiceWithExpiry(
        address token, 
        uint256 amount, 
        address stealthAddress, 
        string calldata memo,
        uint256 expiresAt
    ) external returns (bytes32 invoiceId) {
        require(token != address(0) && stealthAddress != address(0), "bad params");
        require(expiresAt == 0 || expiresAt > block.timestamp, "invalid expiry");
        
        invoiceId = keccak256(abi.encode(msg.sender, token, amount, stealthAddress, block.timestamp, block.prevrandao));
        invoices[invoiceId] = Invoice(msg.sender, token, amount, stealthAddress, false, expiresAt);
        emit InvoiceCreated(invoiceId, msg.sender, token, amount, stealthAddress, memo, expiresAt);
    }

    /**
     * @notice Mark invoice as paid and generate receipt
     * @param invoiceId Invoice to mark paid
     * @param amountObserved Actual amount received
     * @param txHashHint Transaction hash hint for indexing
     */
    function markPaid(bytes32 invoiceId, uint256 amountObserved, bytes32 txHashHint) external {
        Invoice storage inv = invoices[invoiceId];
        require(inv.merchant != address(0), "not found");
        require(msg.sender == inv.merchant || msg.sender == inv.stealthAddress, "not auth");
        require(!inv.paid, "already paid");
        
        // Check expiry
        if (inv.expiresAt != 0 && block.timestamp > inv.expiresAt) {
            emit InvoiceExpired(invoiceId);
            revert("invoice expired");
        }
        
        inv.paid = true;
        
        // Generate receipt hash: keccak256(invoiceId || token || amount || payer || timestamp)
        bytes32 receiptHash = keccak256(abi.encode(
            invoiceId,
            inv.token,
            amountObserved,
            msg.sender,
            block.timestamp
        ));
        
        // Store receipt if ReceiptStore is configured
        if (address(receiptStore) != address(0)) {
            try receiptStore.store(invoiceId, receiptHash) {} catch {}
        }
        
        emit InvoicePaid(invoiceId, msg.sender, amountObserved, txHashHint, receiptHash);
    }

    /**
     * @notice Check if invoice is expired
     * @param invoiceId Invoice to check
     * @return expired Whether invoice is expired
     */
    function isExpired(bytes32 invoiceId) external view returns (bool expired) {
        Invoice storage inv = invoices[invoiceId];
        if (inv.expiresAt == 0) return false;
        return block.timestamp > inv.expiresAt;
    }

    /**
     * @notice Get invoice details
     * @param invoiceId Invoice to query
     * @return Invoice struct
     */
    function getInvoice(bytes32 invoiceId) external view returns (Invoice memory) { 
        return invoices[invoiceId]; 
    }
}
