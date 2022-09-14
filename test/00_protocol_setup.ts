import { expect } from 'chai';

import {
  setupProtocol,
  modl,
  modlAllowance,
  deployContracts,
  grantPermissions,
} from './helpers/contracts';
import { CREDMARK_DEPLOYER, setupUsers } from './helpers/users';
import { DEFAULT_ADMIN_ROLE, MINTER_ROLE } from './helpers/roles';

describe('Protocol Setup - Deployment', () => {
  before(async () => {
    await setupUsers();
    await deployContracts();
  });

  it('Modl is Deployed', async () => {
    expect(modl.address).to.not.be.false;
  });

  it('Modl Allowance is Deployed', async () => {
    expect(modlAllowance.address).to.not.be.false;
  });
});

describe('Protocol Setup - Pre Initialization', () => {
  before(async () => {
    await setupUsers();
    await deployContracts();
    await grantPermissions();
  });

  it('Modl Allowance is not a minter of Modl', async () => {
    expect(await modl.hasRole(MINTER_ROLE, modlAllowance.address)).to.be.false;
  });
});

describe('Protocol Setup - Post Setup', () => {
  before(async () => {
    await setupProtocol();
  });
  it('Deployer is default admin of modl', async () => {
    expect(await modl.hasRole(DEFAULT_ADMIN_ROLE, CREDMARK_DEPLOYER.address)).to
      .be.true;
  });

  it('Modl Allowance is a minter of Modl', async () => {
    expect(await modl.hasRole(MINTER_ROLE, modlAllowance.address)).to.be.true;
  });
});
