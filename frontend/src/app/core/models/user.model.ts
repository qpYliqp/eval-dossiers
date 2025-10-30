export class User{
    id: number;
    firstName: string;
    lastName: string;
    mailAdress: string;
    role: string;

    constructor(id: number, firstName: string, lastName: string, mailAdress: string, role: string) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.mailAdress = mailAdress;
        this.role = role;
    }

    get fullName(): string {
        return this.firstName + " " + this.lastName;
      }
}
