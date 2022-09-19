# Credmark Protocol Contracts

[Auditor Docs](AUDIT.md)

[Protocol Description](https://docs.google.com/document/d/1Fhv6fyjoxCYrnN2H9PoNkmhT8ojtxJGFoOZ3pjsCuMI/edit?usp=sharing)
# Quickstart

`npm i`

`npm run compile`

## Hardhat Mainnet Fork
This project will test in an ethereum fork. This is necessary for us to integrate with Uniswapv3 contracts.

## Testing

Commands:



`npm run test`

`npm run test:gas`

`npm run test:coverage`

## Revert Messages

Reversions are used to: 
- prevent illegal operations
- prevent malicious activity
- prevent invalid states
- prevent unnecessary operations

`VE:{variableName}` Value Error - this variable's value is unacceptable.

`TL` - Time Locked - This operation is timelocked and cannot be performed.

`S` - Started - A contract is in started state.

`NS` - Not Started - A contract isn't started.

`ZB` - Zero Balance - there's nothing to transfer. Don't do this, because why waste the gas?

`IP` - Invalid Proof - A merkle proof failed.

`IC` - Is Claimed - A merkle claim proof has already been claimed.

`NA` - Null Address - Certain operations need to be performed on valid addresses. `address(0x0)` isn't one of those addresses in this case.

## Permissions, Configurations, and Interfaces

We're using Interface best practices. In addition we're creating Configuration .sol files for each of our configurable contracts so that we can manage permissions, configurations, and the like in a self-consistent way. 

The contracts are:
```
    contracts/v2-core/configuration/Permissioned.sol
    contracts/v2-core/configuration/Configurable.sol
    contracts/v2-core/configuration/C{ContractName}.sol
```

Standard Permissions are:
- `DEFAULT_ADMIN_PERMISSION` from openzeppelin's Access Management. Granted to deployer upon deployment. This is the only permission that can grant other permissions. Must be revoked later.
- `CONFIGURER_ROLE` modifier: `configurer` which is a role that will be given to governance decisions in the future
- `MANAGER_ROLE` modifier: `manager` this is a role for either public or constant operations. Managers may vary for different tasks, such as maintaining the oracles or cleaning the liquidity manager.
- `TRUSTED_CONTRACT` Rewards issuers have trusted contracts that determine whether or not the Subscription is trusted to issue rewards. No human should ever have this permission.

### C* files

For configurations, Including a Configuration file gives us the opportunity to assign a deployer as a Configurer of a contract, and unify contract configuration to a single operation with a modifier that only allows contract functions to execute after configuration is complete. It's broken into a standard format:

```

contract CContractName is Configurable {
    struct ConstructorParams { ... }

    struct Configuration { ... }

    Configuration public config;

    constructor(ConstructorParams memory params) {
        // set immutable variables.
        param = type(params.param);
    }

    function configure(Configuration memory newConfig) external configurer {
        config = newConfig;
        _configured = true;
    }

    type public immutable param;
}

```
`ConstructorParams` are immutable setup parameters. `Configuration` is global configuration that should only be changed by SUPER privleged entities, such as a governance contract or a multisig.

then in the constructor fo the Contract, we structure it like this:

```
    constructor(ConstructorParams memory params) { 
        immutableContract = IContractIWant(params.contractAddress);

        /* Validate and set up contract */
    }

    function canOnlyHappenPostConfiguration() external configured {
        /* stuff */
    }

    function canOnlyBeExecutedByTheConfigurer() external configurer {
        /* stuff */
    }
```

## Modl

Modl is the core credmark token. It's replacing CMK as the Credmark primary.

It is based on the openzeppelin ERC20 wizard here: https://docs.openzeppelin.com/contracts/4.x/wizard

```
    contracts/token/Modl.sol
    contracts/interfaces/IModl.sol
```