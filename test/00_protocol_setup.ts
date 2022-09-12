import { expect } from 'chai';

import {
  setupProtocol,
  MODL,
  MODLAllowance,
  deployContracts,
} from './helpers/contracts';
import { CREDMARK_DEPLOYER, setupUsers } from './helpers/users';
import { DEFAULT_ADMIN_ROLE, MINTER_ROLE } from './helpers/roles';

describe('Protocol Setup - Deployment', () => {
  before(async () => {
    await setupUsers();
    await deployContracts();
  });

  it('Modl is Deployed', async () => {
    expect(MODL.address).to.not.be.false;
  });

  it('Modl Allowance is Deployed', async () => {
    expect(MODLAllowance.address).to.not.be.false;
  });
});

describe('Protocol Setup - Pre Initialization', () => {
  before(async () => {
    await setupUsers();
    await deployContracts();
  });

  it('Modl Allowance is not a minter of Modl', async () => {
    expect(await MODL.hasRole(MINTER_ROLE, MODLAllowance.address)).to.be.false;
  });
});

describe('Protocol Setup - Post Setup', () => {
  before(async () => {
    await setupProtocol();
  });
  it('Deployer is default admin of MODL', async () => {
    expect(await MODL.hasRole(DEFAULT_ADMIN_ROLE, CREDMARK_DEPLOYER.address)).to
      .be.true;
  });

  it('Modl Allowance is a minter of Modl', async () => {
    expect(await MODL.hasRole(MINTER_ROLE, MODLAllowance.address)).to.be.true;
  });
});
