// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IWETH9 {
    function deposit() external payable;
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface INonfungiblePositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    function createAndInitializePoolIfNecessary(
        address token0,
        address token1,
        uint24 fee,
        uint160 sqrtPriceX96
    ) external payable returns (address pool);

    function mint(MintParams calldata params)
        external
        payable
        returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);
}

contract MemeSlotToken is ERC20 {
    struct Socials {
        string twitter;
        string website;
    }

    string public logo;
    string public description;
    Socials public socials;
    address public immutable creator;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory logo_,
        string memory description_,
        Socials memory socials_,
        address creator_,
        uint256 supply_
    ) ERC20(name_, symbol_) {
        logo = logo_;
        description = description_;
        socials = socials_;
        creator = creator_;
        _mint(msg.sender, supply_);
    }
}

/// @notice Permissionless MEME SLOT launcher for Robinhood Chain.
/// The full fixed supply and all supplied ETH are placed in a full-range V3
/// position whose NFT is minted directly to the burn address.
contract MemeSlotTokenLauncher is ReentrancyGuard {
    using SafeERC20 for ERC20;

    uint256 public constant SUPPLY = 1_000_000_000 ether;
    uint24 public constant POOL_FEE = 10_000; // 1%
    int24 public constant TICK_LOWER = -887_200;
    int24 public constant TICK_UPPER = 887_200;
    address public constant LP_LOCK = 0x000000000000000000000000000000000000dEaD;

    INonfungiblePositionManager public immutable positionManager;
    IWETH9 public immutable weth;

    event TokenLaunched(
        address indexed token,
        address indexed pool,
        address indexed creator,
        uint256 positionId,
        uint128 liquidity,
        uint256 ethLiquidity
    );

    error InvalidInput();
    error LiquidityRequired();

    constructor(address positionManager_, address weth_) {
        if (positionManager_ == address(0) || weth_ == address(0)) revert InvalidInput();
        positionManager = INonfungiblePositionManager(positionManager_);
        weth = IWETH9(weth_);
    }

    function launch(
        string calldata name_,
        string calldata symbol_,
        string calldata logo_,
        string calldata description_,
        MemeSlotToken.Socials calldata socials_,
        uint256 amount0Min,
        uint256 amount1Min,
        uint256 deadline
    ) external payable nonReentrant returns (address token, address pool, uint256 positionId) {
        if (bytes(name_).length == 0 || bytes(symbol_).length == 0) revert InvalidInput();
        if (msg.value == 0) revert LiquidityRequired();

        MemeSlotToken launched = new MemeSlotToken(
            name_, symbol_, logo_, description_, socials_, msg.sender, SUPPLY
        );
        token = address(launched);
        address token0 = token < address(weth) ? token : address(weth);
        address token1 = token < address(weth) ? address(weth) : token;
        uint256 ratioX128 = token0 == token
            ? (msg.value << 128) / SUPPLY
            : (SUPPLY << 128) / msg.value;
        uint160 sqrtPriceX96 = uint160(_sqrt(ratioX128) << 32);
        if (sqrtPriceX96 == 0) revert LiquidityRequired();

        pool = positionManager.createAndInitializePoolIfNecessary(
            token0, token1, POOL_FEE, sqrtPriceX96
        );

        weth.deposit{value: msg.value}();
        launched.approve(address(positionManager), SUPPLY);
        weth.approve(address(positionManager), msg.value);

        uint256 amount0Desired = token0 == token ? SUPPLY : msg.value;
        uint256 amount1Desired = token1 == token ? SUPPLY : msg.value;
        uint128 liquidity;
        uint256 amount0;
        uint256 amount1;
        (positionId, liquidity, amount0, amount1) = positionManager.mint(
            INonfungiblePositionManager.MintParams({
                token0: token0,
                token1: token1,
                fee: POOL_FEE,
                tickLower: TICK_LOWER,
                tickUpper: TICK_UPPER,
                amount0Desired: amount0Desired,
                amount1Desired: amount1Desired,
                amount0Min: amount0Min,
                amount1Min: amount1Min,
                recipient: LP_LOCK,
                deadline: deadline
            })
        );

        uint256 tokenLeft = launched.balanceOf(address(this));
        if (tokenLeft > 0) ERC20(token).safeTransfer(msg.sender, tokenLeft);
        uint256 wethLeft = weth.balanceOf(address(this));
        if (wethLeft > 0) require(weth.transfer(msg.sender, wethLeft));

        emit TokenLaunched(token, pool, msg.sender, positionId, liquidity, msg.value);
    }

    function _sqrt(uint256 x) private pure returns (uint256 z) {
        if (x == 0) return 0;
        z = 1;
        uint256 y = x;
        if (y >> 128 > 0) { y >>= 128; z <<= 64; }
        if (y >> 64 > 0) { y >>= 64; z <<= 32; }
        if (y >> 32 > 0) { y >>= 32; z <<= 16; }
        if (y >> 16 > 0) { y >>= 16; z <<= 8; }
        if (y >> 8 > 0) { y >>= 8; z <<= 4; }
        if (y >> 4 > 0) { y >>= 4; z <<= 2; }
        if (y >> 2 > 0) { z <<= 1; }
        unchecked {
            for (uint256 i; i < 7; ++i) z = (z + x / z) >> 1;
            uint256 roundedDown = x / z;
            return z < roundedDown ? z : roundedDown;
        }
    }
}
