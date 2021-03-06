/**
 * Partnership is a class that represents the relationship between two AbstractNodes
 * and their children.
 *
 * @class Partnership
 * @constructor
 * @extends AbstractNode
 * @param x the x coordinate at which the partnership junction will be placed
 * @param y the y coordinate at which the partnership junction will be placed
 * @param partner1 an AbstractPerson who's one of the partners in the relationship.
 * @param partner2 an AbstractPerson who's the other partner in the relationship. The order of partners is irrelevant.
 * @id the unique ID number of this node
 */

var Partnership = Class.create(AbstractNode, {

   initialize: function($super, x, y, partner1, partner2, id) {
       if(partner1.getType() != 'PlaceHolder' || partner2.getType() != 'PlaceHolder') {
           this._partners = [partner1, partner2];
           this._pregnancies = [];
           this._partners[0].addPartnership(this);
           this._partners[1].addPartnership(this);
           this._childlessStatus = null;
           this._childlessReason = "";
           $super(x, y, id);
           this._type = 'Partnership';
       }
   },

    /*
     * Generates and returns an instance of PartnershipVisuals
     *
     * @param x,y the x and y coordinates of this partnership
     */
    generateGraphics: function(x, y) {
        return new PartnershipVisuals(this, x, y);
    },

    /*
     * Returns an array containing the two partners. Partners are AbstractPerson objects
     */
    getPartners: function() {
        return this._partners;
    },

    /*
     * Returns the female partner in the partnership. Returns null if none of the parents are female
     */
    getMother: function() {
        if(this.getPartners()[0].getGender() == "F") {
            return this.getPartners()[0];
        }
        else if(this.getPartners()[1].getGender() == "F") {
            return this.getPartners()[1];
        }
        else {
            return null;
        }
    },

    /*
     * Returns the male partner in the partnership. Returns null if none of the parents are male
     */
    getFather: function() {
        if(this.getPartners()[0].getGender() == "M") {
            return this.getPartners()[0];
        }
        else if(this.getPartners()[1].getGender() == "M") {
            return this.getPartners()[1];
        }
        else {
            return null;
        }
    },

    /*
     * Returns the partner of someNode if someNode is a partner in this relationship. Otherwise, returns null.
     *
     * @param someNode is an AbstractPerson
     */
    getPartnerOf: function(someNode) {
        if(someNode) {
            if(someNode.getID() == this.getPartners()[0].getID()) {
                return this.getPartners()[1];
            }
            else if(someNode.getID() == this.getPartners()[1].getID()) {
                return this.getPartners()[0];
            }
            else {
                return null;
            }
        }
    },

    /*
     * Returns true if someNode is a partner in this relationship.
     *
     * @param someNode is an AbstractPerson
     */
    contains: function(someNode) {
        return (this.getPartners()[0] == someNode || this.getPartners()[1] == someNode);
    },

    /*
     * Returns an array of pregnancies stemming from this partnership.
     */
    getPregnancies: function() {
        return this._pregnancies;
    },

    /*
     * Returns an array of nodes that are children of this partnership
     *
     * @param type can filter the array to the specified type (eg. "PlaceHolder", "Person", etc)
     * Multiple types can be passed (eg. getChildren(type1, type2,...,typeN)
     */
    getChildren: function(type) {
        var args = arguments,
            children = [];
        this.getPregnancies().each(function(pregnancy) {
            children = children.concat(pregnancy.getChildren.apply(pregnancy, args));
        });
        return children;
    },

    /*
     * Returns true if someNode is a child of this partnership.
     *
     * @param someNode is an AbstractPerson
     */
    hasChild: function(someNode) {
        var found = false;
        this.getPregnancies().each(function(pregnancy) {
            if(pregnancy.hasChild(someNode)) {
                found = true;
                throw $break;
            }
        });
        return found;
    },

    /*
     * Creates and returns a new Pregnancy for this partnership
     */
    createPregnancy: function() {
        //var id = this.getID();
        //var pos = editor.findPosition({below: id}, ['pregnancy']);
        return editor.getGraph().addPregnancy(this.getX(), this.getY() + PedigreeEditor.attributes.radius * 2, this);
    },

    /*
     * Adds pregnancy to list of pregnancies associated with this partnership
     */
    addPregnancy: function(pregnancy) {
        if(pregnancy && pregnancy.getType() == "Pregnancy") {
            var newPreg = true;
            this.getPregnancies().each(function(preg){
                if(preg.getID() == pregnancy.getID()) {
                    newPreg = false;
                    throw $break;
                }
            });
            newPreg && this.getPregnancies().push(pregnancy);
            return pregnancy;
        }
        return null;
    },

    /*
     * Removes pregnancy from the list of pregnancies associated with this partnership
     */
    removePregnancy: function(pregnancy) {
        this._pregnancies = this._pregnancies.without(pregnancy);
        var p = this.getPartners();
        if(this._pregnancies.length == 0 && (p[0].getType() == "PlaceHolder" || p[1].getType() == "PlaceHolder")) {
            this.remove(false);
        }
    },

    hasPregnancy: function(pregnancy) {
        if(pregnancy) {
            for(var i = 0; i<this.getPregnancies().length; i++) {
                if(this.getPregnancies()[i].getID() == pregnancy.getID())
                    return true;
            }
        }
        return false;
    },

    /*
     * Creates a new pregnancy and a new child for that pregnancy. Returns the child.
     *
     * @param type the type of AbstractPerson that this child should be (eg. "Person", "PlaceHolder", etc)
     * @param gender should be "M", "F", or "U"
     */
    createChild: function(type, gender) {
        var placeholders = this.getPlaceHolderPregnancies();
        if(placeholders.length != 0) {
            var child = placeholders[0].getChildren('PlaceHolder')[0].convertTo(type, gender);
            this.getChildlessStatus() && child.setAdopted(true);
            return child;
        }
        else {
            var pregnancy = this.createPregnancy();
            pregnancy.setGender(gender);
            return pregnancy.createChild(type);
        }
    },

    createNodeAction: function(type, gender) {
        var phPregnancyInfo,
            phInfo;
        this.getPregnancies().each(function(p) {
            if(p.isPlaceHolderPregnancy()) {
                phPregnancyInfo = p.getInfo();
                phInfo = p.getChildren()[0].getInfo();
            }
        });

        var child = this.createChild(type, gender);
        if(child && child.getParentPregnancy()) {
            var childInfo = child.getInfo(),
                nodeID = this.getID(),
                preg = child.getParentPregnancy(),
                pregInfo = (preg ) ? preg.getInfo() : null,
                newPreg = (!phPregnancyInfo || (preg.getID() != phPregnancyInfo.id));

            var undoFunct = function() {
                var me = editor.getGraph().getNodeMap()[nodeID];
                if(me) {
                    var pregnancy = editor.getGraph().getNodeMap()[pregInfo.id]
                    pregnancy && pregnancy.remove(false);
                    var target = editor.getGraph().getNodeMap()[childInfo.id]
                    target && target.remove(false);
                    if(!newPreg) {
                        pregnancy = editor.getGraph().addPregnancy(pregInfo.x, pregInfo.y, me, pregInfo.id)
                        var ph = editor.getGraph().addPlaceHolder(phInfo.x, phInfo.y, phInfo, phInfo.id);
                        pregnancy && pregnancy.addChild(ph);
                    }
                }
            };

            var redoFunct = function() {
                var existingChild = editor.getGraph().getNodeMap()[childInfo.id],
                    me = editor.getGraph().getNodeMap()[nodeID];
                if(me && !(existingChild)) {
                    var target = editor.getGraph()["add" + type](childInfo.x, childInfo.y, gender, childInfo.id);
                    var existingPreg = editor.getGraph().getNodeMap()[pregInfo.id];
                    var pregnancy = (existingPreg) ? existingPreg : editor.getGraph().addPregnancy(pregInfo.x, pregInfo.y, me, pregInfo.id);
                    pregnancy.addChild(target);
                    if(!newPreg){
                        var ph = editor.getGraph().getNodeMap()[phInfo.id];
                        ph && ph.remove(false);
                    }
                }
            };
            editor.getActionStack().push({undo: undoFunct, redo: redoFunct})
        }
        return child;
    },

    /*
     * Adds someNode to the list of children of this partnership, and stores this partnership
     * as it's parent partnership. Returns someNode.
     *
     * @param someNode is an AbstractPerson
     */
    addChild: function(someNode) {
        if(someNode && this.canBeParentOf(someNode)) {
            var phPregnancies = this.getPlaceHolderPregnancies();
            if(phPregnancies.length != 0) {
                phPregnancies[0].addChild(someNode);
                phPregnancies[0].getChildren("PlaceHolder")[0].remove();
            }
            else {
                this.createPregnancy().addChild(someNode);
            }
        }
        return someNode;
    },

    /*
     * Generates an actionStack entry for adding a child
     * @param child the child that is being added to this partnership
     */
    addChildAction: function(child) {
        if(this.addChild(child)) {
            var childID = child.getID(),
                preg = child.getParentPregnancy(),
                pregInfo = preg.getInfo(),
                part = preg.getPartnership().getInfo();

            var redoFunct = function() {
                var source = editor.getGraph().getNodeMap()[part.partnershipID];
                var theChild = editor.getGraph().getNodeMap()[childID];
                if(source && theChild) {
                    var pregnancy = editor.getGraph().addPregnancy(pregInfo.x, pregInfo.y, source, pregInfo.id);
                    pregnancy.addChild(theChild);
                }
            };
            var undoFunct = function() {
                var pregnancy = editor.getGraph().getNodeMap()[pregInfo.id];
                pregnancy && pregnancy.remove(false);
            };
            editor.getActionStack().push({undo: undoFunct, redo: redoFunct});
        }
    },

    /*
     * Removes someNode from the list of children of this partnership, and removes this partnership as its parents
     * reference. Returns someNode.
     *
     * @param someNode is an AbstractPerson
     */
    removeChild: function(someNode) {
        if(someNode) {
            var pregnancy = someNode.getParentPregnancy();
            if(pregnancy && this.hasPregnancy(pregnancy))
                pregnancy && pregnancy.removeChild(someNode);
        }
        return someNode;
    },

    setChildlessStatus: function(status, ignoreChildren) {
        if(status != this.getChildlessStatus()) {
            if(this.isValidChildlessStatus(status)) {
                this._childlessStatus = status;
                if(!ignoreChildren) {
                    this.getChildren("PlaceHolder").each(function(child) {
                            child.remove(false);
                    });
                }
            }
            else {
                this._childlessStatus = null;
                !ignoreChildren && this.restorePlaceholders();
            }
            this.setChildlessReason(null);
            this.getGraphics().updateChildlessShapes();
        }
    },

    hasTwins: function() {
        var pregs = this.getPregnancies();
        for(var i = 0; i < pregs.length; i++) {
            if(pregs[i].getChildren("Person").length > 1) {
                return true;
            }
        }
        return false;
    },

    hasNonAdoptedChildren: function() {
        var pregs = this.getPregnancies();
        for(var i = 0; i < pregs.length; i++) {
            if(pregs[i].hasNonAdoptedChildren())
                return true;
        }
        return false;
    },

    /*
     * Removes this partnership and all the visuals attached to it from the graph.
     * Set isRecursive to true to remove all pregnancies and children, unless they have some other connection
     * to the Proband
     *
     * @param isRecursive can be true or false
     */
    remove: function($super, isRecursive, skipConfirmation) {
        if(isRecursive) {
            return $super(isRecursive, skipConfirmation);
        }
        else {
            this.getPregnancies().each(function(pregnancy) {
                pregnancy.remove();
            });
            var p1 = this.getPartners()[0];
            var p2 = this.getPartners()[1];
            p1.removePartnership(this);
            p2.removePartnership(this);
            p1.getType() == "PlaceHolder" && p1.remove(false);
            p2.getType() == "PlaceHolder" && p2.remove(false);
            this.getGraphics().remove();
            return $super(false);
        }
    },

    /**
     * Returns an array of all adjacent nodes (neighbors) located below this node.
     *
     * @method getLowerNeighbors
     * @return {Array} in the form of [node1, node2, ...]
     */
    getLowerNeighbors: function($super) {
        return $super().concat(this.getPregnancies());
    },

    /*
     * Returns an array containing the two partners of this relationship
     */
    getSideNeighbors: function() {
        return this.getPartners();
    },

    /*
     * Returns true if someNode can be a child of this partnership
     */
    canBeParentOf: function(someNode) {
        return (this.getPartners()[0].canBeParentOf(someNode) && this.getPartners()[1].canBeParentOf(someNode));
    },

    /*
     * Creates a placeholder child for this partnership, if it has no children
     */
    restorePlaceholders: function() {
        if(!this.getPartners()[0].getChildlessStatus() &&
           !this.getPartners()[1].getChildlessStatus() &&
            this.getChildren().length == 0) {
            this.createChild('PlaceHolder', 'U')
        }
    },

    /*
     * Returns a list of pregnancies with only a PlaceHolder child.
     */
    getPlaceHolderPregnancies: function() {
        var pregnancies = [];
        this.getPregnancies().each(function(pregnancy) {
            pregnancy.isPlaceHolderPregnancy() && pregnancies.push(pregnancy);
        });
        return pregnancies;
    },

    /*
     * Returns an object (to be accepted by the menu) with information about this Person
     */
    getSummary: function() {
        var childlessInactive = this.hasNonAdoptedChildren();
        return {
            identifier:    {value : this.getID()},
            childlessSelect : {value : this.getChildlessStatus() ? this.getChildlessStatus() : 'none', inactive: childlessInactive},
            childlessText : {value : this.getChildlessReason() ? this.getChildlessReason() : 'none', inactive: childlessInactive}
        };
    },

    getInfo: function($super) {
        var info = $super();
        info['partner1ID'] = this.getPartners()[0].getID();
        info['partner2ID'] = this.getPartners()[1].getID();
        info['childlessStatus'] = this.getChildlessStatus();
        info['childlessReason'] = this.getChildlessReason();
        return info;
    },

    loadInfo: function($super, info) {
        if($super(info)) {
            if(info.childlessStatus && info.childlessStatus != this.getChildlessStatus()) {
                this.setChildlessStatus(info.childlessStatus);
            }
            if(info.childlessReason && info.childlessReason != this.getChildlessReason()) {
                this.setChildlessReason(info.childlessReason);
            }
            return true;
        }
        return false;
    },

    setChildlessStatusAction: function(status) {
        if(status != this.getChildlessStatus() && (status || this.getChildlessStatus())) {
            var me = this,
                nodeID = this.getID(),
                prevStatus = this.getChildlessStatus(),
                prevReason = this.getChildlessReason();
            var getPhInfo = function() {
                var preg = me.getPregnancies()[0],
                    ph = preg ? preg.getChildren("PlaceHolder")[0] : null;
                return {
                    pregInfo: (preg && preg.isPlaceHolderPregnancy()) ? preg.getInfo() : null,
                    childInfo: ph ? ph.getInfo() : null
                }
            };
            var nodesBeforeChange = getPhInfo(); //PlaceHolder child and pregnancy before changing childlessStatus
            this.setChildlessStatus(status);
            var nodesAfterChange = getPhInfo(); //PlaceHolder child and pregnancy after changing childlessStatus

            editor.getActionStack().push({
                undo: Partnership.childlessActionUndo,
                redo: Partnership.childlessActionRedo,
                nodeID: nodeID,
                status: status,
                prevStatus: prevStatus,
                prevReason: prevReason,
                nodesBeforeChange: nodesBeforeChange,
                nodesAfterChange: nodesAfterChange
            });
        }
    },

    setChildlessReasonAction: function(reason) {
        var nodeID = this.getID();
        var prevReason = this.getChildlessReason();
        this.setChildlessReason(reason);
        var undo = function() {
            var partnership = editor.getGraph().getNodeMap()[nodeID];
            partnership && partnership.setChildlessReason(prevReason);
        };
        var redo = function() {
            var partnership = editor.getGraph().getNodeMap()[nodeID];
            partnership && partnership.setChildlessReason(reason);
        };
        editor.getActionStack().push({undo: undo, redo: redo});
    }
});

Partnership.addMethods(ChildlessBehavior);

Partnership.removeNodes = function(nodes) {
    Object.keys(nodes).forEach(function(key) {
        if(nodes[key]) {
            var node = editor.getGraph().getNodeMap()[nodes[key].id];
            node && node.remove(false);
        }
    });
};

Partnership.restoreNodes = function(nodes, partnership) {
    if(nodes.pregInfo) {
        var pregnancy = editor.getGraph().addPregnancy(nodes.pregInfo.x, nodes.pregInfo.y, partnership, nodes.pregInfo.id);
        if(nodes.childInfo) {
            var child = editor.getGraph().addPlaceHolder(nodes.childInfo.x, nodes.childInfo.y, "U", nodes.childInfo.id);
            pregnancy.addChild(child);
        }
    }
};

Partnership.childlessActionUndo = function(actionElement) {
    var partnership = editor.getGraph().getNodeMap()[actionElement.nodeID];
    if(partnership) {
        Partnership.removeNodes(actionElement.nodesAfterChange);
        partnership.setChildlessStatus(actionElement.prevStatus, true);
        partnership.setChildlessReason(actionElement.prevReason);
        Partnership.restoreNodes(actionElement.nodesBeforeChange, partnership)
    }
};
Partnership.childlessActionRedo = function(actionElement) {
    var partnership = editor.getGraph().getNodeMap()[actionElement.nodeID];
    if(partnership) {
        Partnership.removeNodes(actionElement.nodesBeforeChange);
        partnership.setChildlessStatus(actionElement.status, true);
        Partnership.restoreNodes(actionElement.nodesAfterChange, partnership)
    }
};