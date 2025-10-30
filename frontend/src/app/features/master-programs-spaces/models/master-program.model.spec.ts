import { MasterProgram } from './master-program.model';
import { User } from '../../../core/models/user.model';

describe('MasterProgram', () => {
  it('should create an instance with proper properties', () => {
    // Instantiate User for createdBy and examiners.
    const creator = new User(1, 'John', 'Doe', 'john@example.com', 'admin');
    const examiner = new User(2, 'Jane', 'Smith', 'jane@example.com', 'reviewer');
    const masterProgram = new MasterProgram(
      101,
      'Engineering Master',
      'Engineering',
      new Date('2023-01-01T00:00:00'),
      new Date('2023-06-01T00:00:00'),
      creator,
      [examiner]
    );
    expect(masterProgram).toBeTruthy();
    expect(masterProgram.createdBy.fullName).toBe('John Doe');
  });
});
