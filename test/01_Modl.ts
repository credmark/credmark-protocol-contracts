import { expect } from 'chai';

import { setupProtocol, modl } from './helpers/contracts';
import { setupUsers } from './helpers/users';

describe('Modl.sol', () => {
  before(async () => {
    await setupProtocol();
    await setupUsers();
  });

  it('Modl: totalSupply should initialize to 0', async () => {
    const totalSupply = await modl.functions.totalSupply();
    expect(totalSupply.toString()).to.equal('0');
  });
});
