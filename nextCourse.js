const info = require('./edtinfo')

info.get((result) => {
    let course = info.getNextCourse(result)
    let date = info.getCourseDate(course, result)
    let phrase = 'Le prochain cours est ' + info.getCourseName(course) + ' à ' + date.getHours() + ' heures'
    if (date.getMinutes() != 0) {
        phrase += ' ' + date.getMinutes()
    }
    
    process.stdout.write(phrase + '\n')
})