// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract StealthHelper {
    event Announcement(
        uint256 indexed schemeId,
        address indexed stealthAddress,
        address indexed initiator,
        bytes ephemeralPubKey,
        bytes metadata
    );

    function announce(
        uint256 schemeId,
        address stealthAddress,
        bytes calldata ephemeralPubKey,
        bytes calldata metadata
    ) external {
        require(stealthAddress != address(0) && metadata.length >= 1, "bad params");
        emit Announcement(schemeId, stealthAddress, msg.sender, ephemeralPubKey, metadata);
    }
}
