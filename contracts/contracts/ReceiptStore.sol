// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ReceiptStore {
    event ReceiptStored(bytes32 indexed invoiceId, bytes32 receiptHash, address indexed by);
    
    mapping(bytes32 => bytes32) public receiptOf;

    function store(bytes32 invoiceId, bytes32 receiptHash) external {
        receiptOf[invoiceId] = receiptHash;
        emit ReceiptStored(invoiceId, receiptHash, msg.sender);
    }
}
