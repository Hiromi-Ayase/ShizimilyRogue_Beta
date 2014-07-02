module ShizimilyRogue.View.Data {
    export var Message: { [action: number]: (result:Common.IResult) => string } = {};
    Message[Common.ActionType.Attack] = () => "{object.name}は攻撃した！";
    Message[Common.ActionType.Damage] = () => "{object.name}は{action.params[0]}のダメージ！";
    Message[Common.ActionType.Pick] = () => "{object.name}は{action.objects[0].name}を拾った！";
    Message[Common.ActionType.Use] = () => "{object.name}をたべた";
    Message[Common.ActionType.Heal] = () => "{object.name}は{action.params[0]}回復した";

    Message[Common.ActionType.Die] = (result) => {
        return result.object.id == Common.PLAYER_ID ? "{object.name}は上司に捕まってしまった…" : "{object.name}をやっつけた！";
    }

}

