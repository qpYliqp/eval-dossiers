import { userEntry } from "./userEntry";
import { User } from "../../../../core/models/user.model";

describe('userEntry', () => {
  let user: User;
  let entry: userEntry;

  beforeEach(() => {
    user = new User(1, "Alice", "Don", "alice@example.com", "Dev");
    entry = new userEntry(user);
  });

  it('should be created with valid user', () => {
    expect(entry).toBeTruthy();
  });

  it('should return rights columns with getColumns()', () => {
    const expectedColumns = [
      { key: 'name', label: 'Nom' },
      { key: 'mail', label: 'Email' },
      { key: 'role', label: 'Rôle' }
    ];

    expect(entry.getColumns()).toEqual(expectedColumns);
  });

  it('should return rights values with getValues()', () => {
    user.firstName = "Alice";
    user.lastName = "Don";
    user.mailAdress = "alice@example.com";
    user.role = "Dev";
  
    expect(entry.getValues()).toEqual({
      name: "Alice Don",
      mail: "alice@example.com",
      role: "Dev"
    });
  });
});