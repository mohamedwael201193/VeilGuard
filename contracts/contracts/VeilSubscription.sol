// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VeilSubscription
 * @notice On-chain recurring payment engine for VeilGuard.
 *
 *  Flow:
 *    1. Payer approves this contract for the token (infinite or capped allowance)
 *    2. Payer calls createSubscription() with merchant, token, amount, interval
 *    3. When interval elapses, merchant (or keeper) calls charge()
 *    4. Contract does transferFrom(payer → merchant) each cycle
 *    5. Payer can pause / cancel at any time
 *
 *  Features:
 *    - Fixed-amount recurring charges (weekly, monthly, yearly, custom)
 *    - Optional max-cycle limit
 *    - Pause / resume without cancellation
 *    - Merchant and payer enumeration
 *    - Events for full audit trail
 */
contract VeilSubscription is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status { Active, Paused, Cancelled, Completed }

    struct Subscription {
        address payer;
        address merchant;
        address token;
        uint256 amount;          // per-cycle charge
        uint256 interval;        // seconds between charges
        uint256 nextChargeAt;    // unix timestamp of next valid charge
        uint256 totalCharged;    // cumulative amount charged
        uint256 maxCycles;       // 0 = unlimited
        uint256 cyclesCompleted;
        Status  status;
        string  memo;
        uint256 createdAt;
    }

    uint256 public nextSubscriptionId;
    mapping(uint256 => Subscription) public subscriptions;

    // Enumeration helpers
    mapping(address => uint256[]) private payerSubscriptions;
    mapping(address => uint256[]) private merchantSubscriptions;

    // ── Events ──────────────────────────────────────────────────────
    event SubscriptionCreated(
        uint256 indexed subscriptionId,
        address indexed payer,
        address indexed merchant,
        address token,
        uint256 amount,
        uint256 interval,
        uint256 maxCycles,
        string  memo
    );
    event SubscriptionCharged(
        uint256 indexed subscriptionId,
        uint256 cycle,
        uint256 amount,
        uint256 nextChargeAt
    );
    event SubscriptionCancelled(uint256 indexed subscriptionId, address cancelledBy);
    event SubscriptionPaused(uint256 indexed subscriptionId);
    event SubscriptionResumed(uint256 indexed subscriptionId, uint256 nextChargeAt);
    event SubscriptionAmountUpdated(uint256 indexed subscriptionId, uint256 oldAmount, uint256 newAmount);

    // ── Errors ──────────────────────────────────────────────────────
    error InvalidAddress();
    error InvalidAmount();
    error InvalidInterval();
    error NotPayer();
    error NotPayerOrMerchant();
    error NotChargeable();
    error SubscriptionNotActive();
    error SubscriptionNotPaused();
    error MaxCyclesReached();
    error ChargeNotDue();
    error TransferFailed();

    // ── Core Functions ──────────────────────────────────────────────

    /**
     * @notice Create a new subscription. Payer must have approved this contract.
     * @param merchant    Recipient of each charge
     * @param token       ERC-20 token address
     * @param amount      Amount per cycle in token's smallest unit
     * @param interval    Seconds between charges (e.g. 2592000 for ~30 days)
     * @param maxCycles   Maximum number of charges (0 = unlimited)
     * @param memo        Description of the subscription
     * @return subscriptionId The ID of the created subscription
     */
    function createSubscription(
        address merchant,
        address token,
        uint256 amount,
        uint256 interval,
        uint256 maxCycles,
        string calldata memo
    ) external returns (uint256 subscriptionId) {
        if (merchant == address(0) || merchant == msg.sender) revert InvalidAddress();
        if (token == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (interval < 1 hours) revert InvalidInterval();

        subscriptionId = nextSubscriptionId++;

        subscriptions[subscriptionId] = Subscription({
            payer: msg.sender,
            merchant: merchant,
            token: token,
            amount: amount,
            interval: interval,
            nextChargeAt: block.timestamp,  // first charge is immediate
            totalCharged: 0,
            maxCycles: maxCycles,
            cyclesCompleted: 0,
            status: Status.Active,
            memo: memo,
            createdAt: block.timestamp
        });

        payerSubscriptions[msg.sender].push(subscriptionId);
        merchantSubscriptions[merchant].push(subscriptionId);

        emit SubscriptionCreated(
            subscriptionId, msg.sender, merchant, token, amount, interval, maxCycles, memo
        );
    }

    /**
     * @notice Charge the subscription. Callable by merchant or payer when interval elapsed.
     * @param subscriptionId The subscription to charge
     */
    function charge(uint256 subscriptionId) external nonReentrant {
        Subscription storage s = subscriptions[subscriptionId];
        if (s.status != Status.Active) revert SubscriptionNotActive();
        if (msg.sender != s.merchant && msg.sender != s.payer) revert NotPayerOrMerchant();
        if (block.timestamp < s.nextChargeAt) revert ChargeNotDue();
        if (s.maxCycles > 0 && s.cyclesCompleted >= s.maxCycles) revert MaxCyclesReached();

        s.cyclesCompleted++;
        s.totalCharged += s.amount;
        s.nextChargeAt = block.timestamp + s.interval;

        // Complete if max cycles reached
        if (s.maxCycles > 0 && s.cyclesCompleted >= s.maxCycles) {
            s.status = Status.Completed;
        }

        IERC20(s.token).safeTransferFrom(s.payer, s.merchant, s.amount);

        emit SubscriptionCharged(subscriptionId, s.cyclesCompleted, s.amount, s.nextChargeAt);
    }

    /**
     * @notice Cancel a subscription permanently. Callable by payer or merchant.
     */
    function cancel(uint256 subscriptionId) external {
        Subscription storage s = subscriptions[subscriptionId];
        if (s.status != Status.Active && s.status != Status.Paused) revert SubscriptionNotActive();
        if (msg.sender != s.payer && msg.sender != s.merchant) revert NotPayerOrMerchant();

        s.status = Status.Cancelled;
        emit SubscriptionCancelled(subscriptionId, msg.sender);
    }

    /**
     * @notice Pause a subscription (payer only). Charges stop until resumed.
     */
    function pause(uint256 subscriptionId) external {
        Subscription storage s = subscriptions[subscriptionId];
        if (s.status != Status.Active) revert SubscriptionNotActive();
        if (msg.sender != s.payer) revert NotPayer();

        s.status = Status.Paused;
        emit SubscriptionPaused(subscriptionId);
    }

    /**
     * @notice Resume a paused subscription (payer only). Next charge is set to now + interval.
     */
    function resume(uint256 subscriptionId) external {
        Subscription storage s = subscriptions[subscriptionId];
        if (s.status != Status.Paused) revert SubscriptionNotPaused();
        if (msg.sender != s.payer) revert NotPayer();

        s.status = Status.Active;
        s.nextChargeAt = block.timestamp + s.interval;
        emit SubscriptionResumed(subscriptionId, s.nextChargeAt);
    }

    /**
     * @notice Update the per-cycle amount (payer only, takes effect next cycle).
     */
    function updateAmount(uint256 subscriptionId, uint256 newAmount) external {
        Subscription storage s = subscriptions[subscriptionId];
        if (s.status != Status.Active && s.status != Status.Paused) revert SubscriptionNotActive();
        if (msg.sender != s.payer) revert NotPayer();
        if (newAmount == 0) revert InvalidAmount();

        uint256 old = s.amount;
        s.amount = newAmount;
        emit SubscriptionAmountUpdated(subscriptionId, old, newAmount);
    }

    // ── View Functions ──────────────────────────────────────────────

    function getSubscription(uint256 subscriptionId) external view returns (
        address payer, address merchant, address token,
        uint256 amount, uint256 interval, uint256 nextChargeAt,
        uint256 totalCharged, uint256 maxCycles, uint256 cyclesCompleted,
        Status status, string memory memo, uint256 createdAt
    ) {
        Subscription storage s = subscriptions[subscriptionId];
        return (s.payer, s.merchant, s.token, s.amount, s.interval,
                s.nextChargeAt, s.totalCharged, s.maxCycles, s.cyclesCompleted,
                s.status, s.memo, s.createdAt);
    }

    function getPayerSubscriptions(address payer) external view returns (uint256[] memory) {
        return payerSubscriptions[payer];
    }

    function getMerchantSubscriptions(address merchant) external view returns (uint256[] memory) {
        return merchantSubscriptions[merchant];
    }

    function isChargeable(uint256 subscriptionId) external view returns (bool) {
        Subscription storage s = subscriptions[subscriptionId];
        if (s.status != Status.Active) return false;
        if (block.timestamp < s.nextChargeAt) return false;
        if (s.maxCycles > 0 && s.cyclesCompleted >= s.maxCycles) return false;
        return true;
    }

    function totalSubscriptions() external view returns (uint256) {
        return nextSubscriptionId;
    }
}
