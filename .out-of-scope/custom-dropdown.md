# Custom dropdown list

This project does not replace the open list of a native `<select>` with its own dropdown component. The closed field is ours; the list that opens is the browser's and the operating system's.

## Why this is out of scope

UX.md rule 11 already sets the pattern: `ui/NativeSelect` is a styled closed trigger (`appearance: none`, theme colors, our own chevron) over a native `<select>`. Only the trigger is themed. When the learner taps it, the platform's own list opens.

That is the better control on the devices most learners use. On iOS the native picker is a wheel or sheet at the bottom of the screen, sized for thumbs, with the platform's scrolling, haptics and accessibility (VoiceOver, Dynamic Type, keyboard and switch control) for free. A custom list would have to rebuild all of that, would look out of place next to the rest of the OS, and would add code that has to be tested on every device size the app supports.

The same goes for the other places `NativeSelect` is used: the algorithm picker on phones and the settings fields (for example the Fourier drawing picker). Desktop and iPad landscape already use our own popover for the algorithm picker (`PickerPill`), as rule 11 says.

## Prior requests

- #138: "Our own dropdown instead of the OS list, and audit for other native-looking controls"
