window.addEventListener('DOMContentLoaded', function() {

    'use strict';

    // create the audio context here.
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var audio_context = new AudioContext();
    if(!audio_context) {
        console.error('Failed creating audio context.');
    }


    // Get variables from local storage. If they don't exist, create them
    var speed = localStorage.getItem('speed');
    if(!speed) {
        speed = 25; // CW speed, in WPM
    } else {
        // convert the string to a number.
        speed = parseInt(speed);
    }

    var chars = localStorage.getItem('chars');
    if(!chars) {
        chars = 1; // Number of characters to blast out
    } else {
        // convert the string to a number.
        chars = parseInt(chars);
    }

    var pitch = localStorage.getItem('pitch');
    if(!pitch) {
        pitch = 800; // The tone, in Hz.
    }  else {
        // convert the string to a number.
        pitch = parseInt(pitch);
    }

    var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789?./="; // This is what we will be doing the test with.
    var transmitted_string = []; // We will put the transmitted string here.

    update_speed_and_chars(); // we don't do anything here just yet.
    var reveal_text = true; // The main text.
    // At startup, we have to break the cycle.
    document.getElementById('menu_label').textContent = "Start!";
    document.getElementById('menu_label').onclick = function() { make_it_so(); }
    //menu_label_object.onclick = make_it_so(); // Start the stuff on clicking.

    // Handle the presses of the soft keys.
    window.addEventListener('keydown', handle_softkeys);



    function handle_softkeys(keydown_event) {
        switch(keydown_event.key) {
            case 'Enter':
                make_it_so();
                break;

            case 'ArrowUp':
                speed++;
                if(speed > 120) {
                    speed = 120; // 120 WPM, dot is 1 ms.
                }
                break;

            case 'ArrowDown':
                speed--;
                if(speed < 1) {
                    speed = 1; // Lowest speed possible. This QRSS stuff, won't need it.
                }
                break;

            case 'ArrowRight':
                chars++;
                if(chars >= 30) {
                    chars = 30;
                }
                break;

            case 'ArrowLeft':
                chars--;
                if(chars < 1) {
                    chars = 1; // At least one character.
                }
                break;

            // Limit the pitch between 300 and 1500 Hz. This is a secret feature.
            case '4':
                pitch = pitch - 50;
                if(pitch <=300) {
                    pitch = 300;
                }
                break;

            case '6':
                pitch = pitch + 50;
                if(pitch >= 1500) {
                    pitch = 1500;
                }
                break;

            case 'Backspace':
                keydown_event.preventDefault();
                var exit = confirm("Quit?");
                if (exit) {
                    //audio_context.close();
                    // Before we quit, we save our settings to local storage
                    localStorage.setItem('speed', speed);
                    localStorage.setItem('chars', chars);
                    localStorage.setItem('pitch', pitch);
                    window.close();
                }
                break;

        }
        // ..and while we are here, we update the contents of the page too.
        update_speed_and_chars();

    };


    // This function makes things happen: handles the state of the screen, toggles the label and adjusts variables.
    function make_it_so() {

        // When displaying, we need to adjust the font size, because we can, haha.
        var font_size = 7.5/(chars) + 0.5;
        var inner_html_text = '<p style="font-size: '+ font_size +'rem;">'

        // toggle the reveal stuff.
        if(reveal_text) {
            // if it was true, set it to false, and transmit the next group.
            reveal_text = false;
            document.getElementById('reveal_text').innerHTML = inner_html_text + "•".repeat(chars) + '</p>';

            transmitted_string = random_sample(charset, chars); // Create the random sample
            var dot_and_dash_string = convert_to_dots_and_dashes(transmitted_string); // With dots and dashes
            transmit_sequence(dot_and_dash_string, speed, pitch); // Fiddle with the audio.

        } else {
            // if it was false, set it to true
            reveal_text = true;
            document.getElementById('reveal_text').innerHTML = inner_html_text + transmitted_string; + '</p>';
        }

        // Update what's on the screen.
        update_speed_and_chars();

    };

     // This function updates the speed and character numbers on the main screen.
    function update_speed_and_chars() {

        document.getElementById('speed_value').textContent = speed.toFixed(0).padStart(2, "0");
        document.getElementById('chars_value').textContent = chars.toFixed(0);

        if(reveal_text) {
            // if reveal os on, label should be 'Start'
            document.getElementById('menu_label').textContent = "Start!";
        } else {
            //if reveal is off, label should be 'Reveal'
            document.getElementById('menu_label').textContent = "Reveal";
        }

    };

    // This function randomly samples with replacement.
    function random_sample(input_array, no_of_samples) {
        var array_length = input_array.length;
        var output_array = [];
        // We assemble the array, using random pointers
        for(let i = 0; i<no_of_samples; i++) {
            var array_pointer = Math.floor(Math.random() * array_length); // this returns anything between 0 and array_length -1
            //console.log('DEBUG: Array pointer is: ' + array_pointer);
            output_array.push( input_array[array_pointer] );
        }
        // Join the individual bits in the array, to form a string
        return output_array.join("");
    };

    // This function creates dots and dashes in Morse code, with spaces in it for timing.
    // Heavily insprired by: https://github.com/Syncthetic/MorseCode
    function convert_to_dots_and_dashes(input_string) {
        // This is the part of the Morse aplhabet that we use for training. Dots are dots, dashes are dashes, spaces are for timing in between.
        var morse_alphabet = {
            "A": ".- ",     "B": "-... ",   "C": "-.-. ",   "D": "-.. ",    "E": ". ",      "F": "..-. ",   "G": "--. ",    "H": ".... ",
            "I": ".. ",     "J": ".--- ",   "K": "-.- ",    "L": ".-.. ",   "M": "-- ",     "N": "-. ",     "O": "--- ",    "P": ".--. ",
            "Q": "--.- ",   "R": ".-. ",    "S": "... ",    "T": "- ",      "U": "..- ",    "V": "...- ",   "W": ".-- ",    "X": "-..- ",
            "Y": "-.-- ",   "Z": "--.. ",   "0": "----- ",  "1": ".---- ",  "2": "..--- ",  "3": "...-- ",  "4": "....- ",  "5": "..... ",
            "6": "-.... ",  "7": "--... ",  "8": "---.. ",  "9": "----. ",  "?": "..--.. ", ".": ".-.-.- ", "/": "-..-. ",  "=": "-...- "
        };

        var return_string = [];
        // and now we go through the input string, to generate the dots and dashes.
        for(let i=0; i<input_string.length; i++) {
            //console.log('DEBUG: position: ' + i + 'character:' + input_string[i] + ', results in: ' + morse_alphabet[input_string[i]])
            return_string.push( morse_alphabet[input_string[i]] );
        }
        //console.log('DEBUG: dot-dash string is', return_string);
        return return_string.join(""); // This puts the array together as a long string

    };


    // This function transmits the dots and dashes.
    function transmit_sequence(morse_code_string, speed, pitch) {
        var audio_time_now = audio_context.currentTime; // save this time stamp here.
        //console.log('DEBUG: Audio time now is ', + audio_time_now);

        var dot_duration = Math.round(1200/speed); // milliseconds.
        var dash_duration = 3 * dot_duration;

        // Let's build up a timing scheme.
        // i am just telling the audio_context.gain_object when to raise and lower the volume
        // So all we have to do is to pre-calculate each dot and dash's delay, with repect to starting transmitting the sequence.


        var function_call_delay = 200; // Let's start the delay from 50 milliseconds after this function was called.
        var gain_value = 1; // How loud the sound wave should be.

        var oscillator_object = audio_context.createOscillator();
        oscillator_object.type = 'sine';
        oscillator_object.frequency.value = pitch; // Set it to 800 Hz statically. Meh.
        var gain_object = audio_context.createGain();
        gain_object.gain.value = 0; // Mute the oscillator for now.
        oscillator_object.connect(gain_object);
        //oscillator_object.connect(audio_context.destination);
        gain_object.connect(audio_context.destination);
        oscillator_object.start();


        for(let i=0; i<morse_code_string.length; i++) {
            switch(morse_code_string[i]) {
                case '.':
                    // If we have a dot, beep a dot and add the delay.
                    var dot_start_time = audio_time_now + (function_call_delay/1000);
                    var dot_stop_time = audio_time_now + (function_call_delay/1000) + (dot_duration/1000);
                    //console.log('DEBUG: dot: ' + dot_start_time + ', ' + dot_stop_time);
                    generate_tone(gain_value, dot_duration, dot_start_time, dot_stop_time );
                    function_call_delay += dot_duration + dot_duration;
                    break;

                case '-':
                    // If we have a dash, beep a dash, and add the delay.
                    var dash_start_time = audio_time_now + (function_call_delay/1000);
                    var dash_stop_time = audio_time_now + (function_call_delay/1000) + (dash_duration/1000);
                    //console.log('DEBUG: dash: ' + dash_start_time + ', ' + dash_stop_time);
                    generate_tone(gain_value, dot_duration, dash_start_time, dash_stop_time );
                    function_call_delay += dash_duration + dot_duration;
                    break;

                case ' ':
                    // If we have a gap, we just add to the delay.
                    var gap_start_time = audio_time_now + (function_call_delay/1000);
                    var gap_stop_time = audio_time_now + (function_call_delay/1000) + (dot_duration/1000);;
                    //generate_tone(0,  gap_start_time, gap_stop_time );
                    function_call_delay += dot_duration * 3; // On slow devices, adjusting audio settings will take time.
                    break;

            }
        }

        //generate_tone(0.8, audio_time_now, audio_time_now+1); // This should be a one second beep.

        function generate_tone (gain_value, dot_duration, start_time, end_time) {
            // To reduce the clicks in the dots and dashes, we quickly fade in at the beginning, and fade out at the end.
            var gain_ramp_time = 0.15 * (dot_duration/1000); // X * dot_duration, in seconds.
            // Also, this delay should not be longer than 10 milliseconds.
            if(gain_ramp_time > 0.1) {
                gain_ramp_time = 0.1;
            }
            //var gain_ramp_time = 0.01;
            // fade in quickly to eliminate the clicks at the beginning and ends. Lt's say
            gain_object.gain.setValueAtTime(0, start_time-gain_ramp_time)
            gain_object.gain.linearRampToValueAtTime(gain_value, start_time);
            //gain_object.gain.exponentialRampToValueAtTime(gain_value, start_time); // This one works on PC, but doesn't work on KaiOS.

            // This is the original idea, when I just switch volume or frequency. Didn't work properly.
            //gain_object.gain.setValueAtTime(gain_value, start_time);
            //console.log('DEBUG: generate_tone() says that start time is ' + start_time + ', end time is ' + end_time);
            //oscillator_object.frequency.value = 800;
            //console.log('got to the function. Gain is' + gain_object.gain.value);
            //gain_object.gain.setValueAtTime(0, end_time);

            // quickly fade out.
            gain_object.gain.setValueAtTime(gain_value, end_time);
            gain_object.gain.linearRampToValueAtTime(0, end_time + gain_ramp_time);
            //gain_object.gain.exponentialRampToValueAtTime(0, end_time + gain_ramp_time); // This one works on PC, but doesn't work on KaiOS.

        };

        // The entire audio_context with its oscillator and gain node will close once this function returns.
        return;

    };

});

    // Original beep function.
/*
    function beep (pitch, duration) {
        var oscillator_object = audio_context.createOscillator();
        oscillator_object.type = 'sine';
        oscillator_object.frequency.value = pitch; // Set it to 800 Hz statically. Meh.
        var gain_object = audio_context.createGain();
        gain_object.gain.value = 0.8;
        oscillator_object.connect(gain_object);
        //oscillator_object.connect(audio_context.destination);
        gain_object.connect(audio_context.destination);
        oscillator_object.start();

        setTimeout( function() {
            //oscillator_object.stop();
            gain_object.gain.value = 0;
            },
            duration
        );

    };


*/

    // This implementation was not needed in the end, but I may need it in the future.
/*
    // This function creates dots and dashes in Morse code, with spaces in it for timing.
    // Heavily insprired by: https://github.com/Syncthetic/MorseCode
    function convert_to_dots_and_dashes(input_string) {
        // This is the part of the Morse aplhabet that we use for training. Dots are dots, dashes are dashes, spaces are for timing in between.
        var morse_alphabet = {
            "A": ". -  ",           "B": "- . . .   ",           "C": "- . - .   ",           "D": "- . .   ",          "E": ".   ",            "F": ". . - .   ",           "G": "- - .   ",             "H": ". . . .   ",
            "I": ". .   ",          "J": ". - - -   ",           "K": "- . -   ",             "L": ". - . .   ",        "M": "- -   ",          "N": "- .   ",               "O": "- - -   ",             "P": ". - - .   ",
            "Q": "- - . -   ",      "R": ". - .   ",             "S": ". . .   ",             "T": "-   ",              "U": ". . -   ",        "V": ". . . -   ",           "W": ". - -   ",             "X": "- . . -   ",
            "Y": "- . - -   ",      "Z": "- - . .   ",           "0": "- - - - -    ",        "1": ". - - - -   ",      "2": ". . - - -   ",    "3": ". . . - -   ",         "4": ". . . . -   ",         "5": ". . . . .   ",
            "6": "- . . . .   ",    "7": "- - . . .   ",         "8": "- - - . .   ",         "9": "- - - - .   ",      "?": ". . - - . .   ",  ".": ". - . - . -   ",       "/": "- . . - .   ",         "=": "- . . . -   "
        };

        var return_string = [];
        // and now we go through the input string, to generate the dots and dashes.
        for(let i=0; i<input_string.length; i++) {
            //console.log('DEBUG: position: ' + i + 'character:' + input_string[i] + ', results in: ' + morse_alphabet[input_string[i]])
            return_string.push( morse_alphabet[input_string[i]] );
        }
        //console.log('DEBUG: dot-dash string is', return_string);
        return return_string.join(""); // This puts the array together as a long string

    };
*/

    // This implementation does work on a desktop computer, but has precision issues on KaiOS phones due to limited performance.
    // I left this piece of code here, so you can learn from my mistake :D This took me two days to figure out.
/*
    // This function transmits the dots and dashes.
    function transmit_sequence(morse_code_string, speed, pitch) {
        var dot_duration = Math.round(1200/speed); // milliseconds.
        var dash_duration = 3 * dot_duration;
        // This is actually a very interesting problem:
        // https://stackoverflow.com/questions/51018481/random-behavior-of-settimeout-on-console-how-to-get-counts-in-order-and-reason

        // Let's build up a timing scheme.
        // SetTimeoout executes a function after a time delay. In a loop, all setTimeouts are being called at the same time.
        // So all we have to do is to pre-calculate each dot and dash's delay, with repect to starting transmitting the sequence.

        var dot_delay = 2 * dot_duration; // The gap before the dot (1 unit) and the dot itself (1 unit)
        var dash_delay = 4 * dot_duration; // The gap before the dash (1 unit) and the dash itself (3 units)

        var audio_control_delay = 65;
        var function_call_delay = 0; // Let's start the delay from 50 milliseconds after this function was called.
        var gain_value = 0.8; // How loud the sound wave should be.

        var oscillator_object = audio_context.createOscillator();
        oscillator_object.type = 'sine';
        oscillator_object.frequency.value = pitch; // Set it to 800 Hz statically. Meh.
        var gain_object = audio_context.createGain();
        gain_object.gain.value = 0.8;
        oscillator_object.connect(gain_object);
        //oscillator_object.connect(audio_context.destination);
        gain_object.connect(audio_context.destination);
        oscillator_object.start();


        for(let i=0; i<morse_code_string.length; i++) {
            switch(morse_code_string[i]) {
                case '.':
                    // If we have a dot, beep a dot and add the delay.
                    setTimeout(function() {
                        //beep(pitch, dot_duration);
                        generate_tone(gain_value, dot_duration);
                    }, function_call_delay);
                    function_call_delay += dot_duration + dot_duration + audio_control_delay;
                    break;

                case '-':
                    // If we have a dash, beep a dash, and add the delay.
                    setTimeout(function() {
                        //beep(pitch, dash_duration);
                        generate_tone(gain_value, dash_duration );
                    }, function_call_delay);
                    function_call_delay += dash_duration + dot_duration + audio_control_delay;
                    break;

                case ' ':
                    // If we have a gap, we just add to the delay.
                    setTimeout(function() {
                        generate_tone(0, dash_duration);
                    }, function_call_delay);
                    function_call_delay += dot_duration * 3 + audio_control_delay; // On slow devices, adjusting audio settings will take time.
                    break;

            }
        }


        //generate_tone(gain_object, 1, 1000);
        // For some reason, once I stop an oscillator, I can't seem to be able to start it up.
        // So as a work-around, I am re-initialising the oscillator every time I want to beep.
        // Heavily inspired by: https://stackoverflow.com/questions/879152/how-do-i-make-javascript-beep
        function generate_tone (gain_value, duration) {

            gain_object.gain.value = gain_value;
            //oscillator_object.frequency.value = 800;
            //console.log('got to the function. Gain is' + gain_object.gain.value);
            setTimeout( function() {
                //oscillator_object.stop();
                gain_object.gain.value = 0;
                //oscillator_object.frequency.value = 0;
                //console.log('Gain is set to ' + gain_object.gain.value);
                },
                duration
            );

        };

        // By this time we get here, we know that function_call_delay will have everything.
        setTimeout(function() {
            oscillator_object.stop(); // now we can kill the oscillator
        }, function_call_delay + 200);
        //console.log('DEBUG: Total transmit time was: ' + function_call_delay + ' ms.');
    };
*/
