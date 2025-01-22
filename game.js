class Item {
    constructor(name, type, effect) {
        this.name = name;
        this.type = type;
        this.effect = effect;
        this.equipped = false; // Add equipped property to track if the item is equipped
    }

    applyEffect(character) {
        this.effect(character);
    }
}

class Sword extends Item {
    constructor(name, damageIncrease) {
        super(name, 'weapon', (character) => {
            character.deck.forEach(card => {
                if (card.type === 'melee') {
                    card.name = 'slash';
                    card.damage += damageIncrease;
                }
            });
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

class RegenerationRing extends Item {
    constructor(name, healingRate) {
        super(name, 'ring', (character) => {
            character.regenerationRate += healingRate;
        });
    }
}

class Staff extends Item {
    constructor(name, spellDamageMultiplier) {
        super(name, 'weapon', (character) => {
            character.spellDamageMultiplier = spellDamageMultiplier;
            character.hasStaff = true;
        });
    }
}

class SpellCard extends Item {
    constructor(name, damage) {
        super(name, 'spell', (character) => {
            character.deck.push({ type: 'spell', name: name, damage: damage });
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
        this.spellDamageMultiplier = 1;
        this.damageResistance = damageResistance;
        this.deck = this.createDeck();
        this.hand = this.drawInitialCards(5);
        this.discardPile = []; // Add discard pile to keep track of used cards
        this.regenerationRate = 0;
        this.hasStaff = false;
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 10; // XP required to level up
        this.xpMultiplier = 1; // Initial XP multiplier
    }

    createDeck() {
        let deck = [];
        for (let i = 0; i < 20; i++) {
            deck.push({ type: 'melee', name: 'punch', damage: Math.floor(Math.random() * 3) + 1 });
        }
        return deck;
    }

    drawInitialCards(number) {
        return this.drawCards(number);
    }

    drawCards(number) {
        let cards = [];
        for (let i = 0; i < number; i++) {
            if (this.deck.length === 0) {
                this.reshuffleDeck(); // Reshuffle discard pile into the deck if it is empty
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
        this.discardPile.push(card); // Add the played card to the discard pile
        this.drawCard();
        return card;
    }

    drawCard() {
        // Ensure the hand never has more than 5 cards
        if (this.hand.length < 5) {
            this.hand.push(...this.drawCards(1));
        }
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    reshuffleDeck() {
        this.deck = this.discardPile;
        this.discardPile = [];
        this.shuffleDeck();
    }

    shuffleHand() {
        this.hand = this.drawInitialCards(5);
    }

    regenerate() {
        this.health = Math.min(this.maxHealth, this.health + this.regenerationRate);
    }

    gainXP(amount) {
        this.xp += amount;
        while (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5); // Increase next level XP requirement
        this.maxHealth = Math.floor(this.maxHealth * 1.1); // Increase max health by 10%
        this.health = this.maxHealth; // Restore health to max
        alert(`Level up! You are now level ${this.level}. Max health increased to ${this.maxHealth}.`);
    }
}

let player, enemy;
let currentPlayer;
let currency;
let inventory;
let equipableInventory; // New array to keep track of equipable items
let round;

function initializeGame() {
    player = new Character('Player', 10);
    enemy = new Character('Enemy', 10);
    currentPlayer = player;
    currency = 0;
    inventory = [];
    equipableInventory = []; // Initialize equipable inventory
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
    
    // Update level and XP bar
    document.getElementById('player-level').innerText = `LVL ${player.level}`;
    const xpPercentage = (player.xp / player.xpToNextLevel) * 100;
    document.getElementById('xp-bar').style.width = `${xpPercentage}%`;

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
        cardDiv.innerText = `${card.name.toUpperCase()}: ${card.damage}`;
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
        itemDiv.innerText = item.equipped ? `${item.name} (e)` : item.name;
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
    let damageMultiplier = 1;
    if (card.type === 'melee') {
        damageMultiplier = character.damageMultiplier;
    } else if (card.type === 'spell' && character.hasStaff) {
        damageMultiplier = character.spellDamageMultiplier + 0.2;
    }
    const damageDealt = card.damage * damageMultiplier * target.damageResistance;
    target.health -= damageDealt;
    target.health = Math.max(0, target.health); // Ensure health doesn't go below 0

    // Apply regeneration effect
    character.regenerate();

    if (target.health <= 0) {
        if (character === player) {
            const xpReward = 1 * player.xpMultiplier;
            player.gainXP(xpReward);
            player.xpMultiplier *= 1.1; // Increase XP multiplier by 10% for the next enemy
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
    document.getElementById('shop').style.display = 'flex'; // Change display to flex for two columns
    populateShop();
}

function exitShop() {
    document.getElementById('battlefield').style.display = 'block';
    document.getElementById('shop').style.display = 'none';
    document.getElementById('enemy').style.display = 'block';
}

function populateShop() {
    const shopItemsDiv = document.getElementById('shop-items');
    const shopConstantsDiv = document.getElementById('shop-constants');
    shopItemsDiv.innerHTML = '';
    shopConstantsDiv.innerHTML = '';

    const allItems = [
        new Sword('Sword', 1),
        new Staff('Staff', 0.2),
        new Armor('Armor'),
        new SpellCard('Fireball', Math.floor(Math.random() * 5) + 5),
        new SpellCard('Lightning', Math.floor(Math.random() * 5) + 5),
        new RegenerationRing('Regeneration Ring', 0.1)
    ];

    const availableItems = allItems.filter(item => {
        if (item instanceof Sword || item instanceof Staff || item instanceof Armor) {
            return !equipableInventory.some(equipItem => equipItem.name === item.name);
        }
        return true;
    });

    availableItems.slice(0, 5).forEach(item => {
        const itemDiv = document.createElement('div');
        let itemCost = 20;

        if (item instanceof RegenerationRing) {
            itemDiv.innerText = `${item.name} - Cost: 1000`;
            itemCost = 1000;
        } else if (item instanceof Staff) {
            itemDiv.innerText = `${item.name} - Cost: 200`;
            itemCost = 200;
        } else if (item instanceof SpellCard) {
            itemDiv.innerText = `${item.name} - Cost: 10`;
            itemCost = 10;
        } else {
            itemDiv.innerText = `${item.name} - Cost: 20`;
        }

        const purchaseButton = document.createElement('button');
        purchaseButton.innerText = 'Buy';
        purchaseButton.addEventListener('click', () => {
            if (currency >= itemCost) {
                currency -= itemCost;
                if (item instanceof SpellCard) {
                    item.applyEffect(player); // Add the spell card directly to the deck
                } else {
                    inventory.push(item);
                    if (item instanceof Sword || item instanceof Staff || item instanceof Armor) {
                        equipableInventory.push(item);
                    }
                }
                updateUI();
                alert(`${item.name} purchased!`);
                populateShop(); // Repopulate shop to reflect available items
            } else {
                alert('Not enough currency!');
            }
        });

        itemDiv.appendChild(purchaseButton);
        shopItemsDiv.appendChild(itemDiv);
    });

    // Constants (always available)
    const healthPotion = new HealthPotion('Health Potion');
    const healthPotionDiv = document.createElement('div');
    healthPotionDiv.className = 'item';
    healthPotionDiv.innerText = `${healthPotion.name} - Cost: 20`;
    const healthPotionButton = document.createElement('button');
    healthPotionButton.innerText = 'Buy';
    healthPotionButton.addEventListener('click', () => {
        if (currency >= 20) {
            currency -= 20;
            inventory.push(healthPotion);
            updateUI();
            alert(`${healthPotion.name} purchased!`);
        } else {
            alert('Not enough currency!');
        }
    });
    healthPotionDiv.appendChild(healthPotionButton);
    shopConstantsDiv.appendChild(healthPotionDiv);
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
        'Health Potion': null,
        'Regeneration Ring': null
    };
    const slotId = slots[item.name];
    if (slotId !== null) {
        document.getElementById(slotId).innerText = `${item.name}: Equipped`;
        item.applyEffect(player);
        item.equipped = true;
        updateUI();
    } else if (item.type === 'potion') {
        item.applyEffect(player);
        inventory = inventory.filter(i => i !== item);
        updateUI();
        alert(`${item.name} used!`);
    }
}

function nextRound() {
    player.shuffleDeck();
    player.hand = player.drawInitialCards(5); // Redraw the hand with 5 cards

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