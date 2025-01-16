class Item {
    constructor(name, type, effect) {
        this.name = name;
        this.type = type;
        this.effect = effect;
    }

    applyEffect(character) {
        this.effect(character);
    }
}

class Weapon extends Item {
    constructor(name, damageMultiplier) {
        super(name, 'weapon', (character) => {
            character.damageMultiplier += damageMultiplier;
        });
    }
}

class Armor extends Item {
    constructor(name) {
        super(name, 'armor', (character) => {
            character.damageResistance = 0.1;
        });
    }
}

class SpellCard extends Item {
    constructor(name, damage) {
        super(name, 'spell', (character) => {
            character.deck.push({ damage: damage });
        });
    }
}

class HealthPotion extends Item {
    constructor(name) {
        super(name, 'potion', (character) => {
            character.health = Math.min(character.maxHealth, character.health + 10);
        });
    }
}

class Character {
    constructor(name, health, damageMultiplier = 1, damageResistance = 1) {
        this.name = name;
        this.health = health;
        this.maxHealth = health;
        this.damageMultiplier = damageMultiplier;
        this.damageResistance = damageResistance;
        this.deck = this.createDeck();
        this.hand = this.drawInitialCards(5);
    }

    createDeck() {
        let deck = [];
        for (let i = 0; i < 20; i++) {
            deck.push({ damage: Math.floor(Math.random() * 3) + 1 });
        }
        return deck;
    }

    drawInitialCards(number) {
        let hand = [];
        for (let i = 0; i < number; i++) {
            hand.push(this.drawCards(1)[0]);
        }
        return hand;
    }

    drawCards(number) {
        let cards = [];
        for (let i = 0; i < number; i++) {
            if (this.deck.length === 0) {
                break; // Stop drawing if the deck is empty
            }
            const randomIndex = Math.floor(Math.random() * this.deck.length);
            cards.push(this.deck[randomIndex]);
            this.deck.splice(randomIndex, 1);
        }
        return cards;
    }

    playCard(index) {
        const card = this.hand[index];
        this.hand.splice(index, 1);
        this.drawCard();
        return card;
    }

    drawCard() {
        // Ensure the hand never has more than 5 cards
        if (this.hand.length < 5) {
            this.hand.push(...this.drawCards(1));
        }
    }
}

let player, enemy;
let currentPlayer;
let currency;
let inventory;
let round;

function initializeGame() {
    player = new Character('Player', 10);
    enemy = new Character('Enemy', 10);
    currentPlayer = player;
    currency = 0;
    inventory = [];
    round = 1;
    document.getElementById('battlefield').style.display = 'flex';
    document.getElementById('player').style.display = 'block';
    document.getElementById('enemy').style.display = 'block';
    document.getElementById('game-over').style.display = 'none';
    updateUI();
}

function updateUI() {
    document.getElementById('player-health').innerText = Math.floor(player.health);
    document.getElementById('enemy-health').innerText = Math.max(0, Math.floor(enemy.health));
    document.getElementById('currency').innerText = currency;

    if (player.health <= player.maxHealth * 0.1) {
        document.getElementById('player').style.backgroundColor = 'red';
    } else {
        document.getElementById('player').style.backgroundColor = '#e0e0e0';
    }

    const playerCardsDiv = document.getElementById('player-cards');
    playerCardsDiv.innerHTML = '';
    player.hand.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.innerText = `Damage: ${card.damage}`;
        cardDiv.addEventListener('click', () => {
            if (currentPlayer === player) {
                exitShop();
                playTurn(player, index);
            }
        });
        playerCardsDiv.appendChild(cardDiv);
    });

    const inventoryDiv = document.getElementById('inventory');
    inventoryDiv.innerHTML = '';
    inventory.forEach((item) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'inventory-item';
        itemDiv.innerText = item.name;
        itemDiv.addEventListener('click', () => {
            equipItem(item);
        });
        inventoryDiv.appendChild(itemDiv);
    });
}

function playTurn(character, cardIndex) {
    if (character.hand.length === 0) return; // No cards to play

    const card = character.playCard(cardIndex);
    const target = character === player ? enemy : player;
    const damageDealt = card.damage * character.damageMultiplier * target.damageResistance;
    target.health -= damageDealt;
    target.health = Math.max(0, target.health); // Ensure health doesn't go below 0

    if (target.health <= 0) {
        if (character === player) {
            gainReward();
            handleEnemyDeath();
            openShop();
            nextRound();
        } else {
            gameOver();
        }
        return;
    }

    currentPlayer = currentPlayer === player ? enemy : player;
    updateUI();

    if (currentPlayer === enemy) {
        enemyTurn();
    }
}

function enemyTurn() {
    const randomIndex = Math.floor(Math.random() * enemy.hand.length);
    setTimeout(() => {
        playTurn(enemy, randomIndex);
        player.drawCard(); // Draw a card for the player after the enemy's turn
        updateUI();
    }, 1000);
}

// Update the gainReward function to grant currency upon enemy death
function gainReward() {
    const reward = Math.floor(20 * Math.pow(1.1, round - 1));
    currency += reward;
    alert(`You gained ${reward} currency!`);
    round++;
    updateUI();
}

function handleEnemyDeath() {
    document.getElementById('enemy-health').innerText = '0';
    document.getElementById('enemy').style.display = 'none';
}

function openShop() {
    document.getElementById('battlefield').style.display = 'none';
    document.getElementById('shop').style.display = 'block';
    populateShop();
}

function exitShop() {
    document.getElementById('battlefield').style.display = 'block';
    document.getElementById('shop').style.display = 'none';
    document.getElementById('enemy').style.display = 'block';
}

function populateShop() {
    const shopItemsDiv = document.getElementById('shop-items');
    shopItemsDiv.innerHTML = '';

    const allItems = [
        new Weapon('Sword', 0.1),
        new Weapon('Staff', 0.1),
        new Armor('Armor'),
        new SpellCard('Spell Card', Math.floor(Math.random() * 5) + 5),
        new HealthPotion('Health Potion')
    ];

    const shuffledItems = allItems.sort(() => 0.5 - Math.random()).slice(0, 5);

    shuffledItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';
        itemDiv.innerText = `${item.name} - Cost: 20`;

        const purchaseButton = document.createElement('button');
        purchaseButton.innerText = 'Buy';
        purchaseButton.addEventListener('click', () => {
            if (currency >= 20) {
                currency -= 20;
                inventory.push(item);
                updateUI();
                alert(`${item.name} purchased!`);
            } else {
                alert('Not enough currency!');
            }
        });

        itemDiv.appendChild(purchaseButton);
        shopItemsDiv.appendChild(itemDiv);
    });
}

document.getElementById('exit-shop').addEventListener('click', exitShop);

document.getElementById('inventory-button').addEventListener('click', () => {
    const inventory = document.getElementById('inventory');
    inventory.style.display = inventory.style.display === 'block' ? 'none' : 'block';
});

function equipItem(item) {
    const slots = {
        'Sword': 'right-hand-slot',
        'Staff': 'left-hand-slot',
        'Armor': 'chest-slot',
        'Health Potion': null
    };
    const slotId = slots[item.name];
    if (slotId) {
        document.getElementById(slotId).innerText = `${item.name}: Equipped`;
        item.applyEffect(player);
        updateUI();
    } else if (item.type === 'potion') {
        item.applyEffect(player);
        inventory = inventory.filter(i => i !== item);
        updateUI();
        alert(`${item.name} used!`);
    }
}

function nextRound() {
    const newHealth = Math.floor(enemy.maxHealth * 1.1);
    const newDamageMultiplier = enemy.damageMultiplier * 1.1;
    enemy = new Character('Enemy', newHealth, newDamageMultiplier);
    updateUI();
}

function gameOver() {
    document.getElementById('battlefield').style.display = 'none';
    document.getElementById('shop').style.display = 'none';
    document.getElementById('game-over').style.display = 'block';
}

document.getElementById('restart-game').addEventListener('click', () => {
    initializeGame();
});

initializeGame();