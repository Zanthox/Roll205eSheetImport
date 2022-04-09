Introduction

If you are like me, you’ve got PDFs that you bought or obtained from friends with lots of monsters. Roll20 makes a lot of things easy but there is always going to be a certain amount of time required to move those monsters into the game so I finally looked into a solution to import those monster blocks into roll20. The base of this code is not mine but the work of someone 7+ years ago that was now outdated based on roll20 changes. I've done my best with little to no JavaScript or regex experience to get what we are able to get out of it.  
I believe the API scripts/macros/transmogifier are behind the Pro subscription, so I believe you need it to use these tools.If I knew javascript I would probably not need the extra scripts (though re-writing code is bad so I might still use them) and if I knew regex everything would run a bit better and easier, but as of now I don’t know either.
This script was tricky and due to my aforementioned lack of knowledge in the tools used to make it. It was tricky going through seven year old work, updating it for a very changed system and then trying to figure out what parts were already being done elsewhere. It is also hard to not consider that it is in roll20’s best interest to not allow something like this to be easily possible since it could discourage sales on their marketplace - not that most of the PDF’s I wish to import from are even on there. So this does not save as much time and effort as I hoped, but it still cuts out a lot of time for me and hopefully will for you as well.

NOTE: I originally wrote this up as a google doc for friends who likely haven't used any scripts or macros before, sorry if it is a bit for dummies and that I haven't added a lot of formatting here.

I’ll use this example from Monster Manual Expanded II since it was shown on their dmsguild.com store page as an example:

![grandfather of assassins stats](https://user-images.githubusercontent.com/103297938/162561517-69e896b5-0696-478e-957a-e2947838720b.png)

Setup API

First thing to do is add the API script, this is done from here: 

![api screnn](https://user-images.githubusercontent.com/103297938/162561575-fd80eac2-1b71-41ef-a440-bc056eab4430.png)

We want three scripts, one mine and two from the Script Library.
The first one from the Library is called “Tokenmod”, to add Tokenmod just search here:

![script library](https://user-images.githubusercontent.com/103297938/162561583-e2d49916-b79b-4b69-bca5-fd653403a43e.png)

Just add it, it is by one of the most prolific roll20 scripters and has a lot of uses.

![token mod](https://user-images.githubusercontent.com/103297938/162561597-9f9332b5-98b6-4219-8001-e69cf9627a1a.png)

This will allow our Macro to set the token HP/AC on the token bars, assign the token to our character sheet and set it as the default token for the sheet.
Do the same for the second script from the library, ChatSetAttr. This is how I am able to set Traits, Legendary Actions, Bonus Actions and Reactions. 
Next is to add “my” script, select “New Script” next to “Script Library”, and name it something you’ll remember like “StatImport”. Next you need to copy the ImportStats.js file, most current version.
Use Ctrl+a and Ctrl+c to select all of that document and copy it, then paste it in your new script in roll20:

![script save](https://user-images.githubusercontent.com/103297938/162561605-54b977d8-091f-42f9-b500-0ca2ef56e35e.png)

Once you save you are ready to setup a Macro in your roll20 campaign, log into your campaign and select Macros in the upper right, you might never have used this tab before now: 

![add macro](https://user-images.githubusercontent.com/103297938/162561612-07b7c3d8-8118-42e8-a4e4-ff2a36732f91.png)

Use the add button to create a new Macro. Give it a memorable name like “ImportStats” and you can select the “Show as Token Action” checkbox for ease of use but you will likely want to uncheck it whenever you aren't doing your imports to keep it from appearing while you are running games. 
Paste the text below in the “Actions” section:

!jf-parse
!token-mod {{
--set 
    bar1_link|npc_ac
    bar3_link|hp
    defaulttoken
}}

It is not necessary to add the Tokenmod, you only need “!jf-parse”, and you can even type that into the chat with a token selected instead of using this macro. But to get all the benefits of Tokenmod I recommend using this macro or at the very least create a second macro with it, as cutting it out can make the process a bit faster when having formatting issues that cause you to start over a lot. I also know some people like HP to be the green bar instead of the red, so you can just switch the “npc_ac” and “hp”, or change one of the bar#_link text lines to bar2_link if you want to use the blue section.

![editmacro](https://user-images.githubusercontent.com/103297938/162561642-919ab038-747a-4697-b576-ecc59a4d804d.png)

Once you save this, you are ready to go!

Step 1: Get your Monster

First you need your monster. This is two fold. First you need to find it in your PDF, or homebrewery, or wherever else. It will need to be formatted very like that of the original Monster Manual, use the godfatherofassassins.txt file to again copy and paste all into a text editor before roll20's.

Note that spaces and line breaks are VERY IMPORTANT!  Roll20’s text editor also kinda sucks, so I recommend not using that to make edits.
Here are some of my findings to help with the parsing:

	-The expected order of Abilities (everything after the stats section) is: Traits, Actions, Bonus Actions, Legendary Actions, Reactions.
	-Sometimes all you need to do is press ‘del’ at the end of each line then ‘enter’ to make sure the line breaks are there. 
	-Sometimes copying the end of a line to the beginning of the next and pasting that helps.
	-Making all of an ability’s text a single line is often important if you are having issues.
	-Traits often isn’t in the text - it can help to add a new line with “Traits” directly between the stat block section and the start of your Traits.
	-Apostrophes will mess up Ability names, so leave those out. Devil’s Sight messed me up a lot.
	-For Traits\Actions(of any kind) their names are temperamental, so it is important to avoid parentheses or other non-alphanumeric characters as well as very long names, so as you can see in the example above I have moved them to after the period so that they will be part of the text. Having them in the title of a Trait breaks the formatting and I don't know regex so maybe at some point I will learn and fix this if possible.
	-For Actions, sometimes you’ll find sheets with the “Spellcasting” under actions instead of traits, I recommend moving it to traits. 
	-Actions must also start with letter, so not now I have removed the “+2” for his weapons, ‘+’ seems to really mess with the parsing so remove those from attacks.
	-You can leave your (x/day) at the end of the text in the titles of Actions, as long as they have a space before them.  
	-There is a limit on the length of names (on in roll20 but the parsing) so you may want to move things like “(Recharges after a Long Rest)” to the description text.
	-I’ve found that typically most errors happen with sheets with a very large number of Actions that are particularly verbose.
	-Sometimes some Actions (or entire sheets) just refuse to parse. Remember, don’t fight too long with formatting your text to parse- if you are just running into issues with Actions in particular, if you can't fix it in a few seconds\tries it is better to just remove that Action’s text from your token and add those yourself. Don’t spend more time making the text the right format than it would have taken to just copy/paste it into the sheet!
	-Remember to delete your sheet between each attempt. 
	-If you want to include a Bio section, do so at the end of your import text, but at least three lines down. This is useful for things like Lair Actions in particular. Sometimes though, this can still match the right format to get caught by the parse, if you notice it appearing in your reactions/legendary actions just remove it. Adding an apostrophe at the beginning of the bold character blocks is good for stopping this.


The second part of this is getting a token, I’d recommend using http://rolladvantage.com/tokenstamp/
Once you have your token in roll20, copy your monster text as into the GM’s Notes of the token:

![token gm notes](https://user-images.githubusercontent.com/103297938/162561873-9a839710-2198-4ac7-889a-759e0d712a20.png)

Step 2: Click the button!(2x) 

Because of our previous setup, this is typically the easiest step- though sometimes it is the most frustrating because the formatting of your monster stats might be a bit off and you may need to delete the created character sheet and try again. 
Select your token and click the macro button you created during setup- remember you might want to disable the “show as a token action” when not doing your imports so if you don't see it just go back to your macro and so you may need to enable that again! 

![click button](https://user-images.githubusercontent.com/103297938/162561882-052dbb50-55c4-40e4-8ebe-2d1c0aca17c3.png)

It may take a few seconds, but you will then get a message in the roll20 chat and the new character sheet will be at the bottom of your journal: 

![output1](https://user-images.githubusercontent.com/103297938/162561891-40dea3b5-70ab-490e-9bc5-3af6484d6165.png)

If you have issues with the token being set as default or having the bars set, I’d recommend having a second marco for doing that. I’ve found sometimes particularly long sheets after the stats you are importing can cause it to not be able to set the token.
This next part I hope to be able to remove at some point- but so far as I know there isn’t a way around it. There is a bug(?) where if you create a sheet and give it either Traits or Reactions (since they are defined with a similar structure) before opening the sheet they will lose their descriptions. So, to get around this you have to open the sheet before we can add those. It will be at the bottom of your journal, easy to find but much faster and easier since the script made this token represent the sheet you can just double click it while holding the Shift or Alt keys. You can close it right away but I recommend checking your sheet to make sure your sheet imported everything else (all but Traits and Reactions) first:

![first sheet](https://user-images.githubusercontent.com/103297938/162561898-ff55addd-4414-4bfa-bfd9-4a7e5e7d9efc.png)

Now you just select your token again and click your macro button, you’ll see the notice your sheet has been updated:

![output2](https://user-images.githubusercontent.com/103297938/162561902-f3148818-d10e-46ab-9576-c83feeba65dc.png)

Note that the first click (Create) will assemble the entire sheet except Traits and Reactions and the second (Update) will only create your Traits and Reactions- so when first making your sheet if you are having trouble importing your data you will have to delete the sheet to try again. If you have the Create down and are only having issues with Update to make the Traits and Reactions (and they aren’t affecting the rest of the sheet) you can just manually delete any of the bad Traits/Reactions yourself and try updating. If you are having more issues with it you may need to delete the sheet to start over.

Step 3: Finish the Sheet

Now that the sheet is complete you can move it to where you want in the roll20 journal and add the missing details. One of the minor things I have not yet found a way to fix (maybe I’ll figure out a way eventually) is the Skill Checks and Saving Throws will display as just modifier rolls instead of the correct roll unless you edit the sheet and change a value yourself. Usually I just create a new save and skill of 0, stop editing then end again to remove it. But you could just enter a value that is just their modifier and it would still be a valid roll. You can see the way it looks before fixing to know if you need to bother:

![skill and save bad](https://user-images.githubusercontent.com/103297938/162561915-25c00077-5539-489a-97ff-d9604c92feaf.png)

Note the Charisma and Arcana roles added so the sheet notices a change and thus updates the roles to be correct along with our added Traits:

![skill and save good](https://user-images.githubusercontent.com/103297938/162561919-6cdb8f62-4035-4ad9-8eb2-d147bfcccfbf.png)

If you click Edit for your new sheet, you will also notice that your token has been selected as the default token, so it is already ready for you to use in the future.
You can also now take the time to add any Traits, Actions, Spells, Legendary Actions that wouldn’t parse, as well as any spells.  
You’ll also notice a +0 on some Actions that were not Attacks- I’ve taken the liberty of checking for damage dice roles in the text of abilities and while Roll20 doesn’t (currently) support saving throw attacks, you can just roll it like an attack to view the damage.
That’s it! Once You’ve set it up it really is just as easy as creating a token, pasting the stat block, clicking a button, opening\closing the sheet, clicking the button again and then adjusting the saves/skills if the creature had any. I hope it helps! Here is our completed sheet for the Godfather of Assassins:

![finished1](https://user-images.githubusercontent.com/103297938/162561921-3de799cd-77a7-45d9-9303-d09bb70b4c84.png)

![finished2](https://user-images.githubusercontent.com/103297938/162561923-e60fc2ff-1ac8-474c-9254-33fac3d3b1cf.png)

Transferring Sheets Between Games

Sadly, you will have to do this for each campaign you want to be able to use the script- however I think a lot of users don’t know about the Transmogifier - with that you only really need one campaign setup because you can use this roll20 tool to move your monster sheets (or handouts and maps as well). You could create a character sheets campaign and only import into that campaign, then use the Transmogifier to move a sheet to a campaign when you need it. 
Go to the Settings tab and at the bottom under Miscellaneous you can find it:

![transmog](https://user-images.githubusercontent.com/103297938/162561927-b35f0cac-c186-45e7-8b18-64594e372a5b.png)

While powerful, the UI is (currently) TERRIBLE. You can select two of your games and just drag and drop between them- which is very easy and nice. However there is no search or filter capabilities so if you have a large campaign you will have to do a lot of scrolling and then since there is no multiselect you will have to drag each thing individually:
 
 ![transmog2](https://user-images.githubusercontent.com/103297938/162561930-c0460d14-fad1-4b40-bc7e-7a7523bfc0cc.png)

I hope all these can help you for your game!
