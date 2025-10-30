import { User } from './user.model';

describe('User', () => {
  it('should create an instance with proper properties', () => {
    const user = new User(1, 'John', 'Doe', 'john@example.com', 'admin');
    expect(user).toBeTruthy();
    expect(user.fullName).toBe('John Doe');
  });
});
