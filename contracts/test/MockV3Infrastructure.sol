// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockWETH is ERC20("Wrapped Ether", "WETH") {
    function deposit() external payable { _mint(msg.sender, msg.value); }
}

contract MockPositionManager {
    address public lastRecipient;
    address public lastToken0;
    address public lastToken1;
    uint256 public lastAmount0;
    uint256 public lastAmount1;
    uint256 public constant TOKEN_ID = 42;

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

    function createAndInitializePoolIfNecessary(address token0, address token1, uint24, uint160)
        external returns (address)
    {
        lastToken0 = token0;
        lastToken1 = token1;
        return address(0x1234);
    }

    function mint(MintParams calldata params)
        external returns (uint256, uint128, uint256, uint256)
    {
        IERC20(params.token0).transferFrom(msg.sender, address(this), params.amount0Desired);
        IERC20(params.token1).transferFrom(msg.sender, address(this), params.amount1Desired);
        lastRecipient = params.recipient;
        lastAmount0 = params.amount0Desired;
        lastAmount1 = params.amount1Desired;
        return (TOKEN_ID, 1, params.amount0Desired, params.amount1Desired);
    }
}
