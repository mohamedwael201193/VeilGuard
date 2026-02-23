// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title VeilMerchantIndex
 * @notice On-chain merchant registry and invoice enumeration for VeilGuard.
 *
 *  Solves the critical gap: frontend Dashboard relied on localStorage for
 *  invoice listing. This contract provides on-chain enumeration so merchants
 *  can recover their full invoice history from any device.
 *
 *  Features:
 *    - Merchant profile registration
 *    - Invoice indexing (called by InvoiceRegistry or manually)
 *    - Paginated invoice enumeration
 *    - Merchant statistics
 */
contract VeilMerchantIndex {
    struct MerchantProfile {
        string  name;
        string  metadataURI;     // IPFS or URL for extended profile
        uint256 totalInvoices;
        uint256 totalPaid;
        uint256 totalVolume;     // cumulative volume in token units (not normalised)
        uint256 registeredAt;
        bool    active;
    }

    address public owner;
    mapping(address => bool) public authorizedWriters;

    mapping(address => MerchantProfile) public profiles;
    mapping(address => bytes32[]) private merchantInvoices;
    mapping(address => mapping(bytes32 => bool)) private invoiceIndexed;

    address[] private merchantList;
    mapping(address => bool) private merchantRegistered;

    // ── Events ──────────────────────────────────────────────────────
    event MerchantRegistered(address indexed merchant, string name);
    event MerchantUpdated(address indexed merchant, string name, string metadataURI);
    event InvoiceIndexed(address indexed merchant, bytes32 indexed invoiceId);
    event InvoicePaidIndexed(address indexed merchant, bytes32 indexed invoiceId, uint256 amount);
    event AuthorizedWriterSet(address indexed writer, bool authorized);

    // ── Errors ──────────────────────────────────────────────────────
    error NotOwner();
    error NotAuthorized();
    error AlreadyRegistered();
    error NotRegistered();
    error AlreadyIndexed();
    error InvalidName();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAuthorized() {
        if (!authorizedWriters[msg.sender] && msg.sender != owner) revert NotAuthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ── Admin ───────────────────────────────────────────────────────

    function setAuthorizedWriter(address writer, bool authorized) external onlyOwner {
        authorizedWriters[writer] = authorized;
        emit AuthorizedWriterSet(writer, authorized);
    }

    // ── Merchant Registration ───────────────────────────────────────

    /**
     * @notice Register a merchant profile. Callable by the merchant themselves.
     */
    function registerMerchant(string calldata name, string calldata metadataURI) external {
        if (bytes(name).length == 0) revert InvalidName();
        if (merchantRegistered[msg.sender]) revert AlreadyRegistered();

        profiles[msg.sender] = MerchantProfile({
            name: name,
            metadataURI: metadataURI,
            totalInvoices: 0,
            totalPaid: 0,
            totalVolume: 0,
            registeredAt: block.timestamp,
            active: true
        });

        merchantRegistered[msg.sender] = true;
        merchantList.push(msg.sender);

        emit MerchantRegistered(msg.sender, name);
    }

    /**
     * @notice Update merchant profile information.
     */
    function updateProfile(string calldata name, string calldata metadataURI) external {
        if (!merchantRegistered[msg.sender]) revert NotRegistered();
        if (bytes(name).length == 0) revert InvalidName();

        profiles[msg.sender].name = name;
        profiles[msg.sender].metadataURI = metadataURI;

        emit MerchantUpdated(msg.sender, name, metadataURI);
    }

    // ── Invoice Indexing ────────────────────────────────────────────

    /**
     * @notice Index an invoice for a merchant. Callable by authorized writers or the merchant.
     * @param merchant   The merchant address
     * @param invoiceId  The bytes32 invoice ID from InvoiceRegistry
     */
    function indexInvoice(address merchant, bytes32 invoiceId) external {
        // Allow authorized writers (InvoiceRegistry) or the merchant themselves
        if (msg.sender != merchant && !authorizedWriters[msg.sender] && msg.sender != owner) {
            revert NotAuthorized();
        }
        if (invoiceIndexed[merchant][invoiceId]) revert AlreadyIndexed();

        invoiceIndexed[merchant][invoiceId] = true;
        merchantInvoices[merchant].push(invoiceId);

        // Auto-register merchant if not already registered
        if (!merchantRegistered[merchant]) {
            profiles[merchant] = MerchantProfile({
                name: "",
                metadataURI: "",
                totalInvoices: 0,
                totalPaid: 0,
                totalVolume: 0,
                registeredAt: block.timestamp,
                active: true
            });
            merchantRegistered[merchant] = true;
            merchantList.push(merchant);
        }

        profiles[merchant].totalInvoices++;

        emit InvoiceIndexed(merchant, invoiceId);
    }

    /**
     * @notice Record that an indexed invoice was paid. Updates merchant stats.
     * @param merchant   The merchant address
     * @param invoiceId  The bytes32 invoice ID
     * @param amount     The payment amount (in token's smallest unit)
     */
    function markInvoicePaid(address merchant, bytes32 invoiceId, uint256 amount) external {
        if (msg.sender != merchant && !authorizedWriters[msg.sender] && msg.sender != owner) {
            revert NotAuthorized();
        }

        profiles[merchant].totalPaid++;
        profiles[merchant].totalVolume += amount;

        emit InvoicePaidIndexed(merchant, invoiceId, amount);
    }

    // ── View Functions ──────────────────────────────────────────────

    /**
     * @notice Get paginated invoice IDs for a merchant.
     * @param merchant  The merchant address
     * @param offset    Starting index
     * @param limit     Maximum number of IDs to return
     */
    function getMerchantInvoices(
        address merchant,
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory result) {
        bytes32[] storage invoices = merchantInvoices[merchant];
        if (offset >= invoices.length) {
            return new bytes32[](0);
        }

        uint256 end = offset + limit;
        if (end > invoices.length) end = invoices.length;
        uint256 count = end - offset;

        result = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = invoices[offset + i];
        }
    }

    function getMerchantInvoiceCount(address merchant) external view returns (uint256) {
        return merchantInvoices[merchant].length;
    }

    function getMerchantProfile(address merchant) external view returns (
        string memory name, string memory metadataURI,
        uint256 totalInvoices, uint256 totalPaid, uint256 totalVolume,
        uint256 registeredAt, bool active
    ) {
        MerchantProfile storage p = profiles[merchant];
        return (p.name, p.metadataURI, p.totalInvoices, p.totalPaid,
                p.totalVolume, p.registeredAt, p.active);
    }

    function isMerchantRegistered(address merchant) external view returns (bool) {
        return merchantRegistered[merchant];
    }

    function getMerchantCount() external view returns (uint256) {
        return merchantList.length;
    }

    function getMerchantAt(uint256 index) external view returns (address) {
        return merchantList[index];
    }

    function isInvoiceIndexed(address merchant, bytes32 invoiceId) external view returns (bool) {
        return invoiceIndexed[merchant][invoiceId];
    }
}
