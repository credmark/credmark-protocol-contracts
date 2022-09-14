import { expect } from 'chai';
import {
  modl,
  modlAllowance,
  deployContracts,
  grantPermissions,
} from './helpers/contracts';
import { advanceAMonth } from './helpers/time';
import {
  CREDMARK_CONFIGURER,
  CREDMARK_TREASURY_MULTISIG,
  HACKER_ZACH,
  setupUsers,
  USER_ALICE,
  USER_BRENT,
  USER_CAMMY,
} from './helpers/users';

function expectClose(value: number, expectedValue: number) {
  expect(value).to.greaterThanOrEqual(expectedValue * 0.98);
  expect(value).to.lessThanOrEqual(expectedValue * 1.02);
}

describe('ModlAllowance.sol', () => {
  beforeEach(async () => {
    await setupUsers();
    await deployContracts();
    await grantPermissions();
  });

  it('Permissions prevent unauthorized calls', async () => {
    await expect(
      modlAllowance.connect(HACKER_ZACH).configure({
        ceiling: '1000000000000000000000000',
      })
    ).to.be.reverted;
    await expect(
      modlAllowance.connect(HACKER_ZACH).update(HACKER_ZACH.address, '1000')
    ).to.be.reverted;
    await expect(
      modlAllowance.connect(HACKER_ZACH).emergencyStop(HACKER_ZACH.address)
    ).to.be.reverted;
  });

  it('Permissions allow authorized calls', async () => {
    await expect(
      modlAllowance.connect(CREDMARK_CONFIGURER).configure({
        ceiling: '1000000000000000000000000',
      })
    ).not.to.be.reverted;
    await expect(
      modlAllowance
        .connect(CREDMARK_CONFIGURER)
        .update(CREDMARK_TREASURY_MULTISIG.address, '1000')
    ).not.to.be.reverted;
    await expect(
      modlAllowance
        .connect(CREDMARK_CONFIGURER)
        .update(CREDMARK_TREASURY_MULTISIG.address, '10000')
    ).not.to.be.reverted;
    await expect(
      modlAllowance
        .connect(CREDMARK_CONFIGURER)
        .emergencyStop(CREDMARK_TREASURY_MULTISIG.address)
    ).not.to.be.reverted;
  });

  it('Emits Linearly with Time', async () => {
    await expect(
      modlAllowance.connect(CREDMARK_CONFIGURER).configure({
        ceiling: '1000000000000000000000000',
      })
    ).not.to.be.reverted;
    await expect(
      modlAllowance
        .connect(CREDMARK_CONFIGURER)
        .update(CREDMARK_TREASURY_MULTISIG.address, '12000')
    ).not.to.be.reverted;

    for (let i = 0; i < 24; i++) {
      expectClose(
        (
          await modlAllowance.claimableAmount(
            CREDMARK_TREASURY_MULTISIG.address
          )
        ).toNumber(),
        i * 1000
      );
      await advanceAMonth();
    }
  });

  it('The ceiling prevents over-allocation', async () => {
    await expect(
      modlAllowance.connect(CREDMARK_CONFIGURER).configure({
        ceiling: '1000000000000000000000000',
      })
    ).not.to.be.reverted;
    await expect(
      modlAllowance
        .connect(CREDMARK_CONFIGURER)
        .update(USER_ALICE.address, '1000000000000000000000000')
    ).not.to.be.reverted;
    await expect(
      modlAllowance.connect(CREDMARK_CONFIGURER).update(USER_BRENT.address, '1')
    ).reverted;
    await expect(
      modlAllowance.connect(CREDMARK_CONFIGURER).configure({
        ceiling: '1000000000000000000000001',
      })
    ).not.to.be.reverted;
    await expect(
      modlAllowance.connect(CREDMARK_CONFIGURER).update(USER_BRENT.address, '1')
    ).not.reverted;
  });

  it('Cannot Claim the same tokens twice', async () => {
    await expect(
      modlAllowance.connect(CREDMARK_CONFIGURER).configure({
        ceiling: '1000000000000000000000000',
      })
    ).not.to.be.reverted;
    await expect(
      modlAllowance
        .connect(CREDMARK_CONFIGURER)
        .update(USER_ALICE.address, '12000')
    ).not.to.be.reverted;

    for (let i = 0; i < 30; i++) {
      await advanceAMonth();
      await modlAllowance.connect(USER_ALICE).claim(USER_ALICE.address);
    }
    expectClose(
      (await modlAllowance.claimableAmount(USER_ALICE.address)).toNumber(),
      0
    );
    expectClose((await modl.balanceOf(USER_ALICE.address)).toNumber(), 30000);
  });

  it('it claims updated allowance', async () => {
    await expect(
      modlAllowance.connect(CREDMARK_CONFIGURER).configure({
        ceiling: '1000000000000000000000000',
      })
    ).not.to.be.reverted;

    await expect(
      modlAllowance
        .connect(CREDMARK_CONFIGURER)
        .update(USER_ALICE.address, '12000')
    ).not.to.be.reverted;
    await expect(
      modlAllowance
        .connect(CREDMARK_CONFIGURER)
        .update(USER_BRENT.address, '12000')
    ).not.to.be.reverted;
    await expect(
      modlAllowance
        .connect(CREDMARK_CONFIGURER)
        .update(USER_CAMMY.address, '12000')
    ).not.to.be.reverted;

    await advanceAMonth();

    expectClose(
      (await modlAllowance.claimableAmount(USER_ALICE.address)).toNumber(),
      1000
    );
    expectClose(
      (await modlAllowance.claimableAmount(USER_BRENT.address)).toNumber(),
      1000
    );
    expectClose(
      (await modlAllowance.claimableAmount(USER_CAMMY.address)).toNumber(),
      1000
    );

    expectClose(
      (await modlAllowance.totalAllowancePerAnnum()).toNumber(),
      12000 * 3
    );

    await expect(modlAllowance.connect(USER_ALICE).claim(USER_ALICE.address))
      .not.to.be.reverted;
    await expect(modlAllowance.connect(USER_BRENT).claim(USER_BRENT.address))
      .not.to.be.reverted;

    expectClose((await modl.totalSupply()).toNumber(), 1000 * 2);
    expectClose(
      (await modlAllowance.totalAllowancePerAnnum()).toNumber(),
      12000 * 3
    );

    await advanceAMonth();

    expectClose(
      (await modlAllowance.claimableAmount(USER_ALICE.address)).toNumber(),
      1000
    );
    expectClose(
      (await modlAllowance.claimableAmount(USER_BRENT.address)).toNumber(),
      1000
    );
    expectClose(
      (await modlAllowance.claimableAmount(USER_CAMMY.address)).toNumber(),
      2000
    );

    expectClose((await modl.totalSupply()).toNumber(), 1000 * 2);

    await expect(
      modlAllowance.connect(CREDMARK_CONFIGURER).update(USER_ALICE.address, '0')
    ).not.to.be.reverted;
    await expect(
      modlAllowance
        .connect(CREDMARK_CONFIGURER)
        .emergencyStop(USER_BRENT.address)
    ).not.to.be.reverted;

    expectClose((await modl.totalSupply()).toNumber(), 3000);
    expectClose(
      (await modlAllowance.totalAllowancePerAnnum()).toNumber(),
      12000
    );

    await advanceAMonth();

    expectClose(
      (await modlAllowance.claimableAmount(USER_ALICE.address)).toNumber(),
      0
    );
    expectClose(
      (await modlAllowance.claimableAmount(USER_BRENT.address)).toNumber(),
      0
    );
    expectClose(
      (await modlAllowance.claimableAmount(USER_CAMMY.address)).toNumber(),
      3000
    );

    expectClose((await modl.balanceOf(USER_ALICE.address)).toNumber(), 2000);
    expectClose((await modl.balanceOf(USER_BRENT.address)).toNumber(), 1000);
    expectClose((await modl.balanceOf(USER_CAMMY.address)).toNumber(), 0);

    expectClose((await modl.totalSupply()).toNumber(), 3000);
  });
});
