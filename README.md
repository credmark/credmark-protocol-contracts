# Credmark Protocol Contracts

# Quickstart

This project will test in an ethereum fork. This is necessary for us to test using Uniswap factories and the like.

## Testing

Commands:

`npm run compile`

`npm run test`

`npm run test:gas`

## Permissions, Configurations, and Interfaces

We're using Interface best practices. In addition we're creating Configuration .sol files for each of our configurable contracts so that we can manage permissions, configurations, and the like in a self-consistent way. The contracts are:
```
    contracts/configuration/Permissioned.sol
    contracts/configuration/Configurable.sol
    contracts/configuration/C{ContractName}.sol
```

### C* files

For configurations, Including a Configuration file gives us the opportunity to assign a deployer as a Configurer of a contract, and unify contract configuration to a single operation with a modifier that only allows contract functions to execute after configuration is complete. It's broken into a standard format:

```

contract CContractName is Configurable {
    struct ConstructorParams { }

    struct Configuration { }

    Configuration public config;

    function configure(Configuration memory newConfig) external configurer {
        config = newConfig;
        _configured = true;
    }
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

Modl is the core credmark token. It's replacing CMK as the token that the Credmark DAO provides liquidity for. It allows for minting by authorized contracts with the `MINTER_ROLE`

It is based on the openzeppelin ERC20 wizard here: 
```
    contracts/token/Modl.sol
    contracts/interfaces/IModl.sol
```