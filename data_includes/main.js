PennController.ResetPrefix(null); // Shorten command names (keep this line here))

DebugOff();   // Uncomment this line only when you are 100% done designing your experiment

// display a primer that can be clicked past by pressing the space bar
const newPrimer = () => [
    newText('primer', '<div class="primer">*</div>')
        .center()
        .print(),
    newKey(" ").wait(),
    getText('primer').remove(),
];

// First show instructions, then experiment trials, send results and show end screen
Sequence(
    "consent",
    "survey", 
    "instructions", 
    "practice", 
    "start_experiment", 
    randomize("experiment"),
    "end_experiment",
    SendResults(),
    "confirmation-prolific"
);

// This is run at the beginning of each trial
Header(
    // Declare a global Vars in which we will store the participant's info
    newVar("ENGLISH").global(),
    newVar("OTHER_NATIVE").global(),
    newVar("GENDER").global(),
    newVar("AGE").global(),
    newVar("PROLIFIC_PID").global() 
) // Add the participant info to all trials' results lines
.log("ENGLISH"      , getVar("ENGLISH") )
.log("OTHER_NATIVE" , getVar("OTHER_NATIVE") )
.log("GENDER"       , getVar("GENDER") )
.log("AGE"          , getVar("AGE") )
.log("PROLIFIC_PID" , getVar("PROLIFIC_PID") )


newTrial("consent",
    newHtml("consent.html").print()
    ,
    newHtml("form", `<div>
    <input name='consent' id='consent' type='checkbox'><label for='consent' class='fancy'>I have read and understand the information provided about this study. I agree to participate voluntarily, and acknowledge that I can withdraw at any time. I give my consent to participate.</label>
    </div>`)
        .print()
    ,
    newFunction( () => $("#consent").change( e=>{
        if (e.target.checked) getButton("Next").enable()._runPromises();
        else getButton("Next").disable()._runPromises();
    }) ).call()
    ,
    newButton("Next")
        .cssContainer({ "margin-top": "1em", "margin-bottom": "1em" })
        .disable()
        .print()
        .wait()
);

// Increment counter as soon as the participant agrees to start. 
// Different from PCIbex's normal behavior, which is to increment once the experiment is completed. 
// Avoid participants being assigned to the same group if multiple participants start at the same time.
SetCounter("setcounter");


// Instructions
newTrial("survey",
    defaultText
        .cssContainer({ "margin-top": "1em", "margin-bottom": "1em" })
        .print()
    ,   
    newText("participant_info_header", "<h2>Demographic Information</h2><div class='fancy'><p>Please answer the following questions before we start.</p></div>")
    ,
    newText("<b>Are you a native speaker of English?</b>")
    ,
    newScale("inputEnglish", "yes", "no")
        .radio()
        .log()
        .labelsPosition("right")
        .print()
        .wait()
    ,
    newText("<b>Are you a native speaker of a language other than English?</b><br><em>• If yes</em>, enter your other native language(s) in box below.<br><em>• If no</em>, leave box blank.<br>(Confirm by pressing the <kbd>Enter</kbd> key on your keyboard.)")
    ,
    newTextInput("inputOtherNative")
        .log()
        .print()
        .wait()
    ,
    newText("<b>Gender</b>")
    ,
    newScale("inputGender", "female", "male", "other")
        .radio()
        .log()
        .labelsPosition("right")
        .print()
        .wait()
    ,
    newText("<b>Age in years</b><br>(Confirm by pressing <kbd>Enter</kbd>)")
    ,
    newTextInput("inputAge")
        .length(2)
        .log()
        .print()
        .wait()
    ,
    newButton("Start")
        .cssContainer({ "margin-top": "1em", "margin-bottom": "1em" })
        .print()
        // Only validate a click on Start when inputID has been filled
        .wait(
            getTextInput("inputAge").testNot.text("")
        )
    ,
    // Store the text from inputID into the Var element
    getVar("ENGLISH")     .set( getScale("inputEnglish")         ),
    getVar("OTHER_NATIVE").set( getTextInput("inputOtherNative") ),
    getVar("GENDER")      .set( getScale("inputGender")          ),
    getVar("AGE")         .set( getTextInput("inputAge")         ),
    getVar("PROLIFIC_PID").set( GetURLParameter("PROLIFIC_PID")  )
)

newTrial("instructions",
    newHtml("instructions_text", "instructions.html")
        .cssContainer({ "margin": "1em" })
        .print()
    ,
    newButton("go_to_practice", "Start practice")
        .cssContainer({ "margin": "1em" })
        .print()
        .wait()
);

Template( GetTable("practice.csv") , row =>
    newTrial("practice",
        newPrimer(),
        newController("DashedAcceptabilityJudgment", { 
            s: row.SENTENCE
          , mode: "self-paced reading"
          , q: row.question
          , as: [row.response_A, row.response_B]
          , hasCorrect: row.answer=="A" ? 0 : row.answer=="B" ? 1 : false
          , randomOrder: true
        })
            .log()
            .print()
            .wait()
    )
    .log("group",     "no.group")
    .log("item",       row.item)
    .log("condition", "no.condition")
);

// Start experiment
newTrial("start_experiment",
    newText("<h2>The main part of the study now begins.</h2>")
        .print()
    ,
    newButton("go_to_experiment", "Start experiment")
        .print()
        .wait()
);

// Experimental trial from 
Template( GetTable("stimuli2.csv") , row =>
    newTrial("experiment",
        newPrimer(),
        newController("DashedAcceptabilityJudgment", { 
            s: row.prefix + " " + row.target + " " + row.suffix
          , mode: "self-paced reading"
          , q: row.question
          , as: [row.response_A, row.response_B]
          , hasCorrect: row.answer=="A" ? 0 : row.answer=="B" ? 1 : false
          , randomOrder: true
        })
            .log()
            .print()
            .wait()
    )
    .log("group",     row.group)
    .log("item",      row.item)
    .log("condition", row.condition)
);

// End experiment
newTrial("end_experiment",
    newText("<h2>Experiment finished.</h2>")
        .print()
    ,
    newButton("go_to_confirmation", "Finalize")
        .print()
        .wait()
);

// Final screen: explanation of the goal
newTrial("confirmation-prolific",
    newText("<div class='fancy'><h2>Thank you for participating in our study!</h2>" +
    // Prolific link https://doc.pcibex.net/how-to-guides/using-prolific/
    "<p><a href='https://app.prolific.com/submissions/complete?cc=C15HANVT'" +
    "target='_blank'>Click here to confirm your participation on Prolific.</a></p>" +
    "<p>This is a necessary step in order for you to receive participation credit!</p></div>")
        .center()
        .cssContainer({ "margin-top": "1em", "margin-bottom": "1em" })
        .print()
    ,
    newHtml("explain", "end.html")
        .print()
    ,
    // Trick: stay on this trial forever (until tab is closed)
    newButton().wait()
)
    .setOption("countsForProgressBar", false);
