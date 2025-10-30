import { Listable } from "../../../../core/interfaces/listable";
import { User } from "../../../../core/models/user.model";

export class userEntry extends Listable
{
    constructor(private user: User) {
      super()
    }
    getColumns() {
      return [
        { key: 'name', label: 'Nom' },
        { key: 'mail', label: 'Email' },
        { key: 'role', label: 'Rôle' }
      ];
    }
    
    static override getColumns() {
        return [
            { key: 'name', label: 'Nom' },
            { key: 'mail', label: 'Email' },
            { key: 'role', label: 'Rôle' }
          ];
    }
  
    getValues() {
      return {
        name: this.user.fullName,
        mail: this.user.mailAdress,
        role: this.user.role,
      };
    }

    getUser()
    {
      return this.user;
    }

}