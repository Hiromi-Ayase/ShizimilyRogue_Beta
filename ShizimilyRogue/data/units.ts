module ShizimilyRogue.Model.Data {

    export class Ignore extends Enemy {
        category = 1;
        constructor() {
            super("いぐー");
        }
    }

    export class Word extends Enemy {
        category = 2;
        constructor() {
            super("Word");
        }
    }
}
