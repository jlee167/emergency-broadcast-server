export = class NoAvailablePort extends Error {
    constructor() {
        super();
        this.name = 'No Available Port';
        this.message = "All ports are already occupied";
    }
};