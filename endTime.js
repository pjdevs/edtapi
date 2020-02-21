const info = require('./edtinfo')

info.get((result) => {
    let todayCourses = info.getTodayCourses(result)
    let endTime = info.getEndTime(todayCourses[todayCourses.length-1])

    process.stdout.write('Vous finissez à ' + endTime + '\n')
})