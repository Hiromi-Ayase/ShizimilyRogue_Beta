module ShizimilyRogue.View.Data {
    export var Message: { [action: number]: (action:Common.Action) => string } = {};
    Message[Common.ActionType.Attack] = (action) => action.sender.name + "は攻撃した！";
    Message[Common.ActionType.Pick] = (action) => action.sender.name + "は" + action.targets[0].name + "を拾った！";
    Message[Common.ActionType.Use] = (action) => {
        var item = action.item;
        switch (item.category) {
            case Common.ItemType.Sweet:
                return action.sender.name + "は" + action.item.name + "をたべた";
            case Common.ItemType.Case:
                return action.sender.name + "は" + action.item.name + "に" + action.targetItems[0].name + "とかを入れた";
            case Common.ItemType.CPU:
            case Common.ItemType.GraphicBoard:
                if ((<Common.IUnit>action.sender).weapon == action.item) {
                    return action.sender.name + "は" + action.item.name + "を装備した";
                } else {
                    return action.sender.name + "は" + action.item.name + "をはずした";
                }
        }
    }

    Message[Common.ActionType.Status] = (action) => {
        var unit = <Common.IUnit>action.targets[0];
        switch (action.subType) {
            case Common.StatusActionType.Damage:
                return unit.name + "は" + action.param + "のダメージ！";
            case Common.StatusActionType.Heal:
                return unit.name + "は" + action.param + "回復した";
            case Common.StatusActionType.Full:
                if (unit.stomach == unit.maxStomach)
                    return unit.name + "はおなかがいっぱいになった";
                else
                    return unit.name + "はおなかがすこしふくれた";
        }
    }

    Message[Common.ActionType.Die] = (action) => {
        return action.sender.isPlayer()
            ? action.sender.name + "上司に捕まってしまった…"
            : action.sender.name + "をやっつけた！";
    }

}

