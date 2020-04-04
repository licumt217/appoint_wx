module.exports = class extends think.Model {
    get pk(){
        return 'order_id'
    }
    get relation() {
        return {
            therapist_period: think.Model.HAS_ONE
        };
    }
};
