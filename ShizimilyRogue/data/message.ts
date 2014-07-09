﻿module ShizimilyRogue.View.Data {
    export var Message: { [action: number]: (result:Common.IResult) => string } = {};
    Message[Common.ActionType.Attack] = (result) => result.object.name + "は攻撃した！";
    Message[Common.ActionType.Pick] = (result) => result.object.name + "は" + result.targets[0].name + "を拾った！";
    Message[Common.ActionType.Use] = (result) => result.object.name + "をたべた";

    Message[Common.ActionType.Status] = (result) => {
        var unit = <Common.IUnit>result.object;
        switch (result.action.subType) {
            case Common.StatusActionType.Damage:
                return result.object.name + "は" + result.action.param + "のダメージ！";
            case Common.StatusActionType.Heal:
                return result.object.name + "は" + result.action.param + "回復した";
            case Common.StatusActionType.Full:
                if (unit.stomach == unit.maxStomach)
                    return result.object.name + "はおなかがいっぱいになった";
                else
                    return result.object.name + "はおなかがすこしふくれた";
        }
    }

    Message[Common.ActionType.Die] = (result) => {
        return result.object.isPlayer()
            ? result.object.name + "上司に捕まってしまった…"
            : result.object.name + "をやっつけた！";
    }

}

