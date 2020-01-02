export class User {
    constructor(public username: string, public password: string) {}

    public equals = (user2: User): boolean => {
        return this.username === user2.username && this.password === user2.password;
    }
}
