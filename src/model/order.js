module.exports = class extends think.Model {
    get pk(){
        return 'order_id'
    }
    get relation() {
        return {
            therapist: think.Model.HAS_ONE
        };
    }
};
