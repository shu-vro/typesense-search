export function removeHtmlTags(str, activated = true) {
    if (!activated) return str;
    try {
        const re =
            /(<script(\s|\S)*?<\/script>)|(<style(\s|\S)*?<\/style>)|(<!--(\s|\S)*?-->)|(<\/?(\s|\S)*?>)/g;

        return str.replace(re, "");
    } catch (error) {
        console.log(str, error);
    }
}

export function checkValidity(str) {
    if (str === null || str === undefined) {
        return "";
    } else {
        return removeHtmlTags(str);
    }
}
