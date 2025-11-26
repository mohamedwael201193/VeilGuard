// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ReceiptStore v2 - Wave 3
 * @notice Cryptographic receipt storage with access control
 * @dev Receipt commitment: keccak256(invoiceId || token || amount || payer || timestamp)
 * 
 * Wave 3 Changes:
 * - Added access control: only InvoiceRegistry can store receipts
 * - Added receipt verification helper
 * - Added timestamp tracking
 */
contract ReceiptStore {
    event ReceiptStored(bytes32 indexed invoiceId, bytes32 receiptHash, address indexed by, uint256 timestamp);
    event AuthorizedWriterSet(address indexed writer, bool authorized);
    
    // Storage
    mapping(bytes32 => bytes32) public receiptOf;
    mapping(bytes32 => uint256) public receiptTimestamp;
    mapping(address => bool) public authorizedWriters;
    
    // Owner for access control management
    address public immutable owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedWriters[msg.sender] || msg.sender == owner, "not authorized");
        _;
    }

    /**
     * @notice Set authorized writer (InvoiceRegistry contract)
     * @param writer Address to authorize/deauthorize
     * @param authorized Whether to authorize
     */
    function setAuthorizedWriter(address writer, bool authorized) external onlyOwner {
        authorizedWriters[writer] = authorized;
        emit AuthorizedWriterSet(writer, authorized);
    }

    /**
     * @notice Store a receipt hash (v2 - authorized only)
     * @param invoiceId The invoice ID
     * @param receiptHash The receipt commitment hash
     */
    function store(bytes32 invoiceId, bytes32 receiptHash) external onlyAuthorized {
        require(receiptOf[invoiceId] == bytes32(0), "receipt exists");
        receiptOf[invoiceId] = receiptHash;
        receiptTimestamp[invoiceId] = block.timestamp;
        emit ReceiptStored(invoiceId, receiptHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Verify a receipt matches stored hash
     * @param invoiceId The invoice ID
     * @param receiptHash The receipt hash to verify
     * @return valid Whether the receipt is valid
     * @return timestamp When the receipt was stored (0 if not found)
     */
    function verify(bytes32 invoiceId, bytes32 receiptHash) external view returns (bool valid, uint256 timestamp) {
        bytes32 stored = receiptOf[invoiceId];
        return (stored != bytes32(0) && stored == receiptHash, receiptTimestamp[invoiceId]);
    }

    /**
     * @notice Check if receipt exists for invoice
     * @param invoiceId The invoice ID
     * @return exists Whether a receipt exists
     */
    function hasReceipt(bytes32 invoiceId) external view returns (bool exists) {
        return receiptOf[invoiceId] != bytes32(0);
    }
}
