let array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];


function shuffle(array) {
    let currentIndex = array.length;
    while (currentIndex !== 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex],
            array[currentIndex]
        ]
    }
    return array;
}

const random = shuffle(array);
console.log(random);