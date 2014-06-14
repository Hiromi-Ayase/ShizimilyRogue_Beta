module ShizimilyRogue.Model.Data {

    export class Enemy implements Common.IEnemyData {
        unitId = 1;
        name = null;
        speed = Common.Speed.NORMAL;
        maxHp = 100;
        atk = 100;
        def = 100;
        exp = 100;
        drop = null;
        dropProbability = 10;
        awakeProbabilityWhenAppear = 100;
        awakeProbabilityWhenEnterRoom = 100;
        awakeProbabilityWhenNeighbor = 100;
    }

    export class Ignore extends Enemy {
        name = "Ignore";
    }
}
