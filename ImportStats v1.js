(function(jf, undefined) {

    jf.statblock = {
        version: "2.4",
        RegisterHandlers: function() {
            on('chat:message', HandleInput);

            if(jf.rollMonsterHpOnDrop == true) {
                on("add:graphic", function(obj) {
                    jf.rollTokenHp(obj);
                });
            }

            log("JF Statblock ready");
        }
    }

    var status = ''; // To display in chat
    var errors = []; // To log error
    var characterId = null;
    var characterName = null;
    var characterUpdate = null;

    function HandleInput(msg) {

        if(msg.type !== "api") {
            return;
        }

        args = msg.content.split(/\s+/);
        switch(args[0]) {
            case '!build-monster':
            case '!jf-parse':
                jf.getSelectedToken(msg, jf.ImportStatblock);
                break;
            case '!jf-clone':
                return jf.cloneToken(msg, args[1]); 
                break;
        }
    }

    jf.getSelectedToken = jf.getSelectedToken || function(msg, callback, limit) {
        try {
            if(msg.selected == undefined || msg.selected.length == undefined)
                throw('No token selected');

            limit = parseInt(limit, 10) | 0;

            if(limit == undefined || limit > msg.selected.length + 1 || limit < 1)
                limit = msg.selected.length;

            for(i = 0; i < limit; i++) {
                if(msg.selected[i]._type == 'graphic') {
                    var obj = getObj('graphic', msg.selected[i]._id);
                    if(obj !== undefined && obj.get('subtype') == 'token') {
                        callback(obj);
                    }
                }
            }
        } catch(e) {
            log(e);
            log('Exception: ' + e);
            sendChat('GM', '/w GM ' + e);
        }
    }

    jf.capitalizeEachWord = function(str) {
        return str.replace(/\w\S*/g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    jf.setCharacter = function(name, gmnotes, bio) {
        if(name == undefined)
            throw("Name require to get or create character");
        name = jf.capitalizeEachWord(name);

        var obj = findObjs({
            _type: "character",
            name: name
        });

        if(obj.length == 0) {
            obj = createObj('character', {
                name: name
            });
            status = 'Character ' + name + ' created';
            characterUpdate = false;
        } else {
            obj = getObj('character', obj[0].id);
            status = 'Character ' + name + ' updated';
            characterUpdate = true;
        }

        if(obj == undefined)
            throw("Something prevent script to create or find character " + name);

        if(gmnotes != undefined)
            obj.set({
                gmnotes: gmnotes
            });

        if(bio != undefined)
            obj.set({
                bio: bio
            });

        characterId = obj.id;
        characterName = name;
        setAttribut('is_npc', 1);
        setAttribut('npc', 1);
        setAttribut('npc_name', name);
        setAttribut('npc_options-flag', 1);
        setAttribut('whispertoggle', '/w gm ');

        return obj;
    }

    jf.ImportStatblock = function(token) {
        status = 'Nothing modified';
        errors = [];
        try {
            var statblock = token.get('gmnotes').trim();

            if(statblock == '')
                throw("Selected token GM Notes was empty.");

            var name = jf.parseStatblock(statblock);
            if(characterId != null) {
                token.set("represents", characterId);
                token.set("name", name);
            }
        } catch(e) {
            status = "Parsing was incomplete due to error(s)";
            log(e);
            errors.push(e);
        }

        log(status);
        sendChat('JF', '/w GM ' + status);

        if(errors.length > 0) {
            log(errors.join('\n'));
            sendChat('JF', '/w GM Error(s):\n/w GM ' + errors.join('\n/w GM '));
        }
    }
    
    function setAttribut(name, currentVal, max) {

        if(name == undefined)
            throw("Name required to set attribut");

        max = max || '';

        if(currentVal == undefined) {
            log("Error setting empty value: " + name);
            return;
        }

        var attr = findObjs({
            _type: 'attribute',
            _characterid: characterId,
            name: name
        })[0];

        if(attr == undefined) {
            log("Creating attribut " + name);
            createObj('attribute', {
                name: name,
                current: currentVal,
                max: max,
                characterid: characterId
            });
        } else if(attr.get('current') == undefined || attr.get('current').toString() != currentVal) {
            log("Updating attribut " + name);
            attr.set({
                current: currentVal,
                max: max
            });
        }
    }
    
    jf.parseStatblock = function(statblock) {

        texte = clean(statblock);
        var keyword = findKeyword(texte);
        var section = splitStatblock(texte, keyword);
        jf.setCharacter(section.attr.name.trim(), texte.replace(/#/g, '<br>'), section.bio);
        processSection(section);
        return section.attr.name;
    }

    function clean(statblock) {
        statblock = unescape(statblock);
        statblock = statblock.replace(/–/g, '-');
        statblock = statblock.replace(/<br[^>]*>/g, '#').replace(/(<([^>]+)>)/ig, "");
        statblock = statblock.replace(/\s+#\s+/g, '#');
        statblock = statblock.replace(/#(?=[a-z])/g, ' ');
        statblock = statblock.replace(/\s+/g, ' ');

        return statblock;
    }

    function findKeyword(statblock) {
        var keyword = {
            attr: {},
            traits: {},
            actions: {},
            bonusactions: {},
            legendary: {},
            reactions: {}
        };

        var indexAction = 0;
        var indexLegendary = statblock.length;
        var indexReActions = statblock.length;
        var indexBonusActions = statblock.length;

        // Standard keyword
        var regex = /#\s*(tiny|small|medium|large|huge|gargantuan|armor class|hit points|speed|str|dex|con|int|wis|cha|saving throws|skills|damage resistances|damage immunities|condition immunities|damage vulnerabilities|senses|languages|challenge|traits|actions|bonus actions|legendary actions|reactions)(?=\s|#)/gi;
        while(match = regex.exec(statblock)) {
            key = match[1].toLowerCase();

            if(key == 'actions') {
                indexAction = match.index;
                keyword.actions.Actions = match.index;
            } else if(key == 'legendary actions') {
                indexLegendary = match.index;
                keyword.legendary.Legendary = match.index;
            } else if(key == 'bonus actions') {
                indexBonusActions = match.index;
                keyword.bonusactions.BonusActions = match.index;
            } else if(key == 'reactions') {
                indexReActions = match.index;
                keyword.reactions.ReActions = match.index;
            } else {
                keyword.attr[key] = match.index;
            }
        }

        // Power
        regex = /(?:#|\.\s+)([A-Z][\w-]+(?:\s(?:[A-Z][\w-]+|[\(\)\d/-]|of)+)*)(?=\s*\.)/g;
        while(match = regex.exec(statblock)) {
            //log(match);
            if(keyword.attr[match[1].toLowerCase()] == undefined) {
                if(match.index < indexAction){
                    keyword.traits[match[1]] = match.index;
                }
                else if(match.index < indexReActions)
                    if(match.index < indexLegendary)
                        if(match.index < indexBonusActions){
                            keyword.actions[match[1]] = match.index;
                        }
                        else{
                            keyword.bonusactions[match[1]] = match.index;
                        }
                    else{
                        keyword.legendary[match[1]] = match.index;
                    }
                else{
                    keyword.reactions[match[1]] = match.index;
                }
            }
        }

        return keyword;
    }

    function splitStatblock(statblock, keyword) {
        // Check for bio (flavor texte) at the end, separated by at least 3 line break.
        var bio;
        if((pos = statblock.indexOf('###')) != -1) {
            bio = statblock.substring(pos + 3).replace(/^[#\s]/g, "");
            bio = bio.replace(/#/g, "<br>").trim();
            statblock = statblock.slice(0, pos);
        }

        var debut = 0;
        var fin = 0;
        var keyName = 'name';
        var sectionName = 'attr';

        for(var section in keyword) {
            var obj = keyword[section];
            for(var key in obj) {
                var fin = parseInt(obj[key], 10);
                keyword[sectionName][keyName] = extractSection(statblock, debut, fin, keyName);
                keyName = key;
                debut = fin;
                sectionName = section;
            }
        }
        keyword[sectionName][keyName] = extractSection(statblock, debut, statblock.length, keyName);

        delete keyword.actions.Actions;
        delete keyword.legendary.Legendary;
        delete keyword.reactions.ReActions
        delete keyword.bonusactions.BonusActions
        
        if(bio != null) keyword.bio = bio;

        // Patch for multiline abilities
        var abilitiesName = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        var abilities = '';
        for(i = 0, len = abilitiesName.length; i < len; ++i) {
            if(keyword.attr[abilitiesName[i]] != undefined) {
                abilities += keyword.attr[abilitiesName[i]] + ' ';
                delete keyword.attr[abilitiesName[i]]
            }
        }
        keyword.attr.abilities = abilities;

        // Size attribut:
        var size = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan'];
        for(i = 0, len = abilitiesName.length; i < len; ++i) {
            if(keyword.attr[size[i]] != undefined) {
                keyword.attr.size = size[i] + ' ' + keyword.attr[size[i]];
                delete keyword.attr[size[i]];
                break
            }
        }

        //Move legendary action summary to trait.
        if(keyword.legendary["Legendary Actions"] !== undefined) {
            keyword.traits["Legendary Actions"] = keyword.legendary["Legendary Actions"];
            delete keyword.legendary["Legendary Actions"];
        }
        
        //Move bonus action summary to trait.
        if(keyword.bonusactions["Bonus Actions"] !== undefined) {
            keyword.traits["Bonus Actions"] = keyword.bonusactions["Bonus Actions"];
            delete keyword.bonusactions["Bonus Actions"];
        }
        //Move reaction summary to trait.
        if(keyword.reactions["Reactions"] !== undefined) {
            keyword.traits["Reactions"] = keyword.reactions["Reactions"];
            delete keyword.reactions["Reactions"];
        }
        return keyword;
    }

    function extractSection(texte, debut, fin, title) {
        section = texte.substring(debut, fin);
        // Remove action name from action description and clean.
        section = section.replace(new RegExp("^[\\s\\.#]*" + title.replace(/([-()\\/])/g, "\\$1") + "?[\\s\\.#]*", 'i'), '');
        section = section.replace(/#/g, ' ');
        return section;
    }

    function processSection(section) {
        //Due to sheet issue requiring you to open it before making Traits/Reactions, only add on update
        if (characterUpdate == true){
            parseTraits(section.traits);
            parseReActions(section.reactions);
        } else {
            // Process abilities first cause needed by other attribut.
            if('abilities' in section.attr) parseAbilities(section.attr.abilities);
            if('size' in section.attr) parseSize(section.attr.size);
            if('armor class' in section.attr) parseArmorClass(section.attr['armor class']);
            if('hit points' in section.attr) parseHp(section.attr['hit points']);
            if('speed' in section.attr) parseSpeed(section.attr.speed);
            if('challenge' in section.attr) parseChallenge(section.attr.challenge);
            if('saving throws' in section.attr) parseSavingThrow(section.attr['saving throws']);
            if('skills' in section.attr) parseSkills(section.attr.skills);
            if('senses' in section.attr) parseSenses(section.attr.senses);
    
            if('damage immunities' in section.attr) setAttribut('npc_immunities', section.attr['damage immunities']);
            if('condition immunities' in section.attr) setAttribut('npc_condition_immunities', section.attr['condition immunities']);
            if('damage vulnerabilities' in section.attr) setAttribut('npc_vulnerabilities', section.attr['damage vulnerabilities']);
            if('languages' in section.attr) setAttribut('npc_languages', section.attr['languages']);
            if('damage resistances' in section.attr) setAttribut('npc_resistances', section.attr['damage resistances']);
            
            parseActions(section.actions);
            parseLegendaryActions(section.legendary);
            parseBonusActions(section.bonusactions);
        }
    }

    /* Section parsing function */
    function parseAbilities(abilities) {
        var regex = /(\d+)\s*\(/g;
        var match = [];

        while(matches = regex.exec(abilities)) {
            match.push(matches[1]);
        }

        setAttribut('strength', match[0]);
        setAttribut('dexterity', match[1]);
        setAttribut('constitution', match[2]);
        setAttribut('intelligence', match[3]);
        setAttribut('wisdom', match[4]);
        setAttribut('charisma', match[5]); 
        setAttribut('strength_base', match[0]);
        setAttribut('dexterity_base', match[1]);
        setAttribut('constitution_base', match[2]);
        setAttribut('intelligence_base', match[3]);
        setAttribut('wisdom_base', match[4]);
        setAttribut('charisma_base', match[5]);
    }

    function parseSize(size) {
        var match = size.match(/(.*?) (.*?), (.*)/i);
        setAttribut('npc_size', match[1]);
        setAttribut('npc_type', match[2]);
        setAttribut('npc_alignment', match[3]);
        setAttribut('npc_type', size);
    }

    function parseArmorClass(ac) {
        var match = ac.match(/(\d+)\s?(.*)/);
        setAttribut('npc_AC', match[1]);
        setAttribut('npc_actype', match[2].substring(1, match[2].length-1));
    }

    function parseHp(hp) {
        var match = hp.match(/.*?(\d+)\s+\(((?:\d+)d(?:\d+))/i);
        setAttribut('hp', match[1], match[1]);
        var match2 = match[2].match(/^(\d+)d(\d+)$/);
        var nb_dice = parseInt(match2[1], 10);
        var hp_bonus = Math.floor((getAttrByName(characterId, 'constitution_base') - 10) / 2);
        setAttribut('npc_hpformula', match[2] + '+' + nb_dice * hp_bonus);
    }

    function parseSpeed(speed) {
        setAttribut('npc_speed', speed);
    }

    function parseChallenge(cr) {
        input = cr.replace(/[, ]/g, '');
        var match = input.match(/([\d/]+).*?(\d+)/);
        setAttribut('npc_challenge', match[1]);
        setAttribut('npc_xp', parseInt(match[2]));
    }

    function parseSavingThrow(save) {
        var regex = /(STR|DEX|CON|INT|WIS|CHA).*?(\d+)/gi;
        var attr,  value;
        while(match = regex.exec(save)) {
            // Substract ability modifier from this field since sheet compute it
            switch(match[1].toLowerCase()) {
                case 'str':
                    attr = 'strength';
                    break;
                case 'dex':
                    attr = 'dexterity';
                    break;
                case 'con':
                    attr = 'constitution';
                    break;
                case 'int':
                    attr = 'intelligence';
                    break;
                case 'wis':
                    attr = 'wisdom';
                    break;
                case 'cha':
                    attr = 'charisma';
                    break;
            }
            setAttribut(attr + '_save_bonus', match[2] - Math.floor((getAttrByName(characterId, attr) - 10) / 2));
            setAttribut('npc_' + match[1].toLowerCase() + '_save_base', match[2] );
            setAttribut('npc_' + match[1].toLowerCase() + '_save_flag', 1);
            setAttribut('npc_saving_flag', 1);
        }
    }

    function parseSkills(skills) {
        // Need to substract ability modifier skills this field since sheet compute it
        var skillAbility = {
            acrobatics: 'dexterity',
            "animal handling": 'wisdom',
            arcana: 'intelligence',
            athletics: 'strength',
            deception: 'charisma',
            history: 'intelligence',
            insight: 'wisdom',
            intimidation: 'charisma',
            investigation: 'intelligence',
            medicine: 'wisdom',
            nature: 'intelligence',
            perception: 'wisdom',
            performance: 'charisma',
            persuasion: 'charisma',
            religion: 'intelligence',
            "sleight of hand": 'dexterity',
            stealth: 'dexterity',
            survival: 'wisdom'
        };

        var regex = /([\w\s]+).*?(\d+)/gi;
        setAttribut('npc_skills_flag', 1);
        while(match = regex.exec(skills.replace(/Skills\s+/i, ''))) {
            var skill = match[1].trim().toLowerCase();
            if(skill in skillAbility) {
                var abilitymod = skillAbility[skill];
                var attr = 'npc_' + skill.replace(/\s/g, '') + '_base';
                var attr2 = 'npc_' + skill.replace(/\s/g, '') + '_flag';
                setAttribut(attr, match[2]);
                setAttribut(attr2, 1);
            } else {
                errors.push("Skill " + skill + ' is not a valid skill');
            }
        }
    }

    function parseSenses(senses) {
            setAttribut('npc_senses', senses);
    }
    
    function parseTraits(traits) {
        var tDescr = "";
        var tName = "";
        _.each(traits, function(value, key) {
            tDescr = value.replace(/[\.\s]+$/, '.')
            tName = key;

           //Call to ChatSetAttr in chat
           log("Calling ChatSetAttr to create Trait: " + tName);
           sendChat('','!setattr-mod --silent --charid ' + characterId + ' --repeating_npctrait_-CREATE_name|' + tName + ' --repeating_npctrait_-CREATE_description|' + tDescr);
        });
    }
    
     function parseActions(actions) {
        _.each(actions, function(value, key) {
            var aName = key;
            var aFlag = 'off';
            var aDescr = '';
            
            // check if attack or just text action.
            var match = value.match(/damage/g);
            if(match != null) {
                aFlag = 'on';
                
                var attackStats = [];
                parseAttack(value, attackStats);
                
                //Call to ChatSetAttr in chat
                log("Calling ChatSetAttr to create Attack Action: " + aName);
                sendChat('','!setattr-mod --silent --charid ' + characterId + ' --repeating_npcaction_-CREATE_name|' + aName + ' --repeating_npcaction_-CREATE_attack_flag|' + aFlag + ' --repeating_npcaction_-CREATE_attack_type|' + attackStats[0] + ' --repeating_npcaction_-CREATE_attack_range|' + attackStats[1] + ' --repeating_npcaction_-CREATE_attack_tohit|' + attackStats[2] + ' --repeating_npcaction_-CREATE_attack_target|' + attackStats[3] + ' --repeating_npcaction_-CREATE_attack_damage|' + attackStats[4] + ' --repeating_npcaction_-CREATE_attack_damagetype|' + attackStats[5] + ' --repeating_npcaction_-CREATE_attack_damage2|' + attackStats[6] + ' --repeating_npcaction_-CREATE_attack_damagetype2|' + attackStats[7] + ' --repeating_npcaction_-CREATE_description|' + attackStats[8] );
            } else {
                aDescr = value.replace(/(\+\s?(\d+))/g, '$1 : [[1d20+$2]]|[[1d20+$2]]');

                //Call to ChatSetAttr in chat
                log("Calling ChatSetAttr to create Action: " + aName);
                sendChat('','!setattr-mod --silent --charid ' + characterId + ' --repeating_npcaction_-CREATE_name|' + aName + ' --repeating_npcaction_-CREATE_attack_flag|' + aFlag + ' --repeating_npcaction_-CREATE_description|' + aDescr );
            }
        });
    }
    
    function parseLegendaryActions(lactions) {
        var count = 1;
        _.each(lactions, function(value, key) {
            //assume 3 legendary actions as is standard 
            if (count == 1 )
                setAttribut('npc_legendary_actions', 3);
            count ++;    
            var laFlag = 'off';
            
            //deterimine if there is an attack by checking for damage
            var damageCheck = value.search(/damage/g);
            if (damageCheck > 0) {
                laFlag = 'on';
                var lattackStats = [];
                parseAttack(value, lattackStats);
                
                //Call to ChatSetAttr in chat
                log("Calling ChatSetAttr to create Legendary Attack Action: " + key);
                sendChat('','!setattr-mod --silent --charid ' + characterId + ' --repeating_npcaction-l_-CREATE_name|' + key + ' --repeating_npcaction-l_-CREATE_attack_flag|' + laFlag + ' --repeating_npcaction-l_-CREATE_attack_type|' + lattackStats[0] + ' --repeating_npcaction-l_-CREATE_attack_range|' + lattackStats[1] + ' --repeating_npcaction-l_-CREATE_attack_tohit|' + lattackStats[2] + ' --repeating_npcaction-l_-CREATE_attack_target|' + lattackStats[3] + ' --repeating_npcaction-l_-CREATE_attack_damage|' + lattackStats[4] + ' --repeating_npcaction-l_-CREATE_attack_damagetype|' + lattackStats[5] + ' --repeating_npcaction-l_-CREATE_attack_damage2|' + lattackStats[6] + ' --repeating-l_npcaction_-CREATE_attack_damagetype2|' + lattackStats[7] + ' --repeating_npcaction-l_-CREATE_description|' + lattackStats[8] );
            } else {
                //Call to ChatSetAttr in chat
                log("Calling ChatSetAttr to create Legendary Action: " + key);
                sendChat('','!setattr-mod --silent --charid ' + characterId + ' --repeating_npcaction-l_-CREATE_name|' + key + ' --repeating_npcaction-l_-CREATE_attack_flag|' + laFlag + ' --repeating_npcaction-l_-CREATE_description|' + value );
            }
        });
    }
    
    function parseReActions(Reactions) {
        var count = 1;
        _.each(Reactions, function(value, key) {
            //enable reactions
            if (count == 1 )
                setAttribut('npcreactionsflag', 1);
            count ++;   
            //Call to ChatSetAttr in chat
            log("Calling ChatSetAttr to create Reaction: " + key);
            sendChat('','!setattr-mod --silent --charid ' + characterId + ' --repeating_npcreaction_-CREATE_name|' + key + ' --repeating_npcreaction_-CREATE_description|' + value );
        });
    }
    
    function parseBonusActions(Bactions) {
        var count = 1;
        _.each(Bactions, function(value, key) {
            //enable bonus actions 
            if (count == 1 )
                setAttribut('npcbonusactionsflag', 1);
            count ++;   
            
            //Call to ChatSetAttr in chat
            log("Calling ChatSetAttr to create Bonus Action: " + key);
            sendChat('','!setattr-mod --silent --charid ' + characterId + ' --repeating_npcbonusaction_-CREATE_name|' + key + ' --repeating_npcbonusaction_-CREATE_description|' + value );
        });
    }
        
    function parseAttack(value, attackArray){
        for(let i = 0; i < 9; i++){
            attackArray[i] = '';
        }
        
        //check for attack roll or just damage
        var hitCheck = value.search(/[hit]\:/g)
        if (hitCheck > 0){
            //check if melee or ranged attack
            var aTypeCheck = value.match(/(Melee)/);
            attackArray[1] = value.substring(value.search(/range /i), value.search(/ ft/i)+3 ).replace(/range/i, '');
            attackArray[0] = 'Ranged';
            if(aTypeCheck != null) {
                attackArray[0] = 'Melee';
                attackArray[1] = value.substring(value.search(/reach /i), value.search(/ ft/i)+3 ).replace(/reach/i, '');
            }  
            
            //get to hit.
            attackArray[2] = value.substring(value.search(/attack:/i) + 7 , value.search(/to hit/i));
            
            //get target
            attackArray[3] = value.substring(value.search(/[.][,]/i)+3, value.search(/[hit]\:/g)-3).trim();
            attackArray[8] = value.substring(value.search(/damage/g)+7);
        } else {
            //set descr to full text for damage only
            attackArray[8] = value;
            attackArray[0] = 'Ranged';
        }
        
        //get damages and damage types
        var aDamageMatch = value.replace(/\s+/g, '').match(/(\d+)?d(\d+)([\+\-]\d+)?/ig);
        var aDamageMatch2 = value.match(/\)(.{1,15})damage/g);
    
        attackArray[4] = aDamageMatch[0];
        attackArray[5] = aDamageMatch2[0].replace(/damage/i, '').substring(1).trim();
        attackArray[6] = '';
        attackArray[7] = '';
        
        //check for second damge (roll20 currently only supports two damage rolls)
       if (aDamageMatch2.length > 1 ) {
           //check for two hands dice to skip if there is a third damage
            if (aDamageMatch2.length > 2){
             var handCheck = value.search(/hands/g);
             if (handCheck > 0) {
                 //set second damage by skipping 2hand damage
                attackArray[6] = aDamageMatch[2];
                attackArray[7] = aDamageMatch2[2].replace(/damage/i, '').substring(1).trim(); 
                
                //set 2hand descr
                attackArray[8] = value.substring(value.search(/[hit]\:/g)+4).trim();
             }
             //set second damage type or 2hand damage if no third damage
            }else {
                attackArray[6] = aDamageMatch[1];
                attackArray[7] = aDamageMatch2[1].replace(/damage/i, '').substring(1).trim();
            }
        } 
    }
    
}(typeof jf === 'undefined' ? jf = {} : jf));

on("ready", function() {
    'use strict';
    jf.statblock.RegisterHandlers();
});
