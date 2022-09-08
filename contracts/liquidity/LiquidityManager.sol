// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "../external/uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "../external/uniswap/v3-core/contracts/libraries/TickMath.sol";
import "../external/uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "../external/uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "../external/uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "../external/uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";

import "../token/Modl.sol";
import "../interfaces/ILiquidityManager.sol";
import "../configuration/CLiquidityManager.sol";

contract LiquidityManager is
    ILiquidityManager,
    CLiquidityManager,
    ReentrancyGuard
{
    constructor(ConstructorParams memory params) CLiquidityManager(params) {}

    INonfungiblePositionManager private constant NFPM =
        INonfungiblePositionManager(0xC36442b4a4522E871399CD717aBDD847Ab11FE88);
    ISwapRouter private constant SWAP =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);
    IUniswapV3Factory private constant FACT =
        IUniswapV3Factory(0x1F98431c8aD98523631AE4a59f267346ea31F984);

    IUniswapV3Pool public pool;
    uint256 public liquidityTokenId;
    uint128 public currentLiquidity;
    uint24 public constant POOL_FEE = 10000;

    int24 tickUpper = 870000;
    int24 tickLower = -870000;
    int24 tickInit = -276300;

    bool private _mutexLocked;
    uint256 public started = 0;

    uint160 sqrtPriceLimitSnap;
    uint256 sqrtPriceLimitSnapTimestamp;

    function mint() external override nonReentrant manager {
        require(started == 0, "CMERR: Pool already Started");
        require(launchLiquidity > 0, "CMERR: No liquidity");
        require(modl.balanceOf(address(this)) == 0, "CMERR: Already minted");
        require(modl.hasRole(keccak256("MINTER_ROLE"), address(this)));

        modl.mint(address(this), launchLiquidity);
        require(modl.balanceOf(address(this)) == launchLiquidity);

        modl.renounceRole(keccak256("MINTER_ROLE"), address(this));
        require(!modl.hasRole(keccak256("MINTER_ROLE"), address(this)));
    }

    function start() external override nonReentrant manager {
        require(started == 0, "CMERR: Pool already Started");
        require(
            modl.balanceOf(address(this)) > 0,
            "CMERR: Can't start without Tokens"
        );

        address poolAddress = FACT.createPool(
            address(modl),
            address(usdc),
            POOL_FEE
        );

        require(
            poolAddress != address(0),
            "CMERR: Couldn't create uniswap pool."
        );

        pool = IUniswapV3Pool(poolAddress);

        if (pool.token0() == address(modl)) {
            tickLower = tickInit + 100;
        } else {
            tickInit = -tickInit;
            tickUpper = tickInit - 100;
        }

        pool.initialize(TickMath.getSqrtRatioAtTick(tickInit));

        require(
            address(pool) != address(0),
            "CMERR: Pool Not Created Successfully"
        );

        TransferHelper.safeApprove(
            address(modl),
            address(NFPM),
            modl.balanceOf(address(this))
        );

        (uint256 tokenId, uint128 liquidity, , ) = NFPM.mint(
            INonfungiblePositionManager.MintParams({
                token0: pool.token0(),
                token1: pool.token1(),
                fee: pool.fee(),
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: IERC20(pool.token0()).balanceOf(address(this)),
                amount1Desired: IERC20(pool.token1()).balanceOf(address(this)),
                amount0Min: 0,
                amount1Min: 0,
                recipient: address(this),
                deadline: block.timestamp
            })
        );

        liquidityTokenId = tokenId;
        currentLiquidity = liquidity;
        started = block.timestamp;
        emit Start(poolAddress);
    }

    function clean(uint160 sqrtPriceLimitX96_)
        external
        override
        nonReentrant
        manager
    {
        require(started != 0, "CMERR: Pool not started");

        (uint160 sqrtPriceLimitX96Check, , , , , , ) = pool.slot0();
        require(
            sqrtPriceLimitX96Check == sqrtPriceLimitX96_,
            "CMERR: sqrtPriceLimit doesn't match."
        );

        NFPM.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: liquidityTokenId,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );

        uint256 usdcBalance = usdc.balanceOf(address(this));

        TransferHelper.safeApprove(address(usdc), address(SWAP), usdcBalance);

        SWAP.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: address(usdc),
                tokenOut: address(modl),
                fee: POOL_FEE,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: usdcBalance,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            })
        );

        uint256 modlBalance = modl.balanceOf(address(this));
        bool modlTransferSuccess = modl.transfer(revenueTreasury, modlBalance);

        emit Clean(sqrtPriceLimitX96_, usdcBalance, modlBalance);

        require(modlTransferSuccess, "Couldn't Transfer Modl");
    }

    function transferPosition(address to) external configurer {
        require(started != 0, "CMERR: Not Started");
        require(block.timestamp > started + lockup, "CMERR: Locked");
        NFPM.transferFrom(address(this), to, liquidityTokenId);
    }
}
