module.exports = class extends think.Model {
	get relation() {
	    return {
	    	children:{
	    		type:think.Model.HAS_MANY,
	    		model:'question_children',
	    		fKey:'parentId',
	    		order:'indexSort ASC',
	    		relation:false
	    	}
	    }
	}
}