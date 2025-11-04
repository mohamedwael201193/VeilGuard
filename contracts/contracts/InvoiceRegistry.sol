// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 { function balanceOf(address) external view returns (uint256); }

contract InvoiceRegistry {
    event InvoiceCreated(bytes32 indexed invoiceId, address indexed merchant, address token, uint256 amount, address stealthAddress, string memo);
    event InvoicePaid(bytes32 indexed invoiceId, address indexed marker, uint256 amountObserved, bytes32 txHashHint);
    event RefundRequested(bytes32 indexed invoiceId, address indexed requester, address refundTo, uint256 amountHint);

    struct Invoice { address merchant; address token; uint256 amount; address stealthAddress; bool paid; }
    
    mapping(bytes32 => Invoice) public invoices;

    function createInvoice(address token, uint256 amount, address stealthAddress, string calldata memo)
        external returns (bytes32 invoiceId)
    {
        require(token != address(0) && stealthAddress != address(0), "bad params");
        invoiceId = keccak256(abi.encode(msg.sender, token, amount, stealthAddress, block.timestamp, block.prevrandao));
        invoices[invoiceId] = Invoice(msg.sender, token, amount, stealthAddress, false);
        emit InvoiceCreated(invoiceId, msg.sender, token, amount, stealthAddress, memo);
    }

    function markPaid(bytes32 invoiceId, uint256 amountObserved, bytes32 txHashHint) external {
        Invoice storage inv = invoices[invoiceId];
        require(inv.merchant != address(0), "not found");
        require(msg.sender == inv.merchant || msg.sender == inv.stealthAddress, "not auth");
        inv.paid = true;
        emit InvoicePaid(invoiceId, msg.sender, amountObserved, txHashHint);
    }

    function getInvoice(bytes32 invoiceId) external view returns (Invoice memory) { return invoices[invoiceId]; }
}
