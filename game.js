// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Image Loading
const playerImage = new Image();
playerImage.src = 'Images/Player_Zombie.png';

// Player Setup
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 100,
  speed: 1.5,
  speedBoost: 2,
  isSpeedBoosted: false,
  angle: 0
};

//Camera Setup
const camera = {
  x: 0,
  y: 0,
  width: window.innerWidth,
  height: window.innerHeight
};

// NPC Setup
let npc = {
  x: canvas.width / 4,
  y: canvas.height / 4,
  size: 50,
  speed: 1,
  color: 'blue',
  dx: 1,
  dy: 1
};

// Soldier NPC Setup
let soldier = null;
const soldierSize = 40;
const soldierSpeed = 1.2;
const soldierFireRate = 200; // Fire rate in frames (60 frames = 1 second)
let soldierFireTimer = 0;

// Projectile Setup
let soldierProjectile = null;
const projectileSize = 5;
const projectileSpeed = 3;



// Zombie NPCs Setup
const zombies = [];
let maxZombies = 2; // Maximum number of zombies alawlowed
const zombieSize = 30;
let zombieSpeed = 0.8;
const zombieGap = 50;

// Score Setup
let score = 999;


// Store Upgrade Tracking
let zombieSpeedUpgradeCost = 40;
let zombieSpeedUpgradeCount = 0;

let zombieArmorUpgradeCost = 50;
let zombieArmorUpgradeCount = 0;
const maxZombieArmorUpgrades = 2;

// Input Setup
const mouse = {
  x: 0,
  y: 0,
  isPressed: false
};

const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
  shift: false
};

// Event Listeners
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('mousedown', handleMouseDown);
document.addEventListener('mouseup', handleMouseUp);

// Update Function
function update() {
  // Player Movement
  if (keys.up) player.y -= player.speed;
  if (keys.down) player.y += player.speed;
  if (keys.left) player.x -= player.speed;
  if (keys.right) player.x += player.speed;

  // Update camera position
  const cameraSpeed = 5;
  if (player.x < camera.x + camera.width * 0.25) {
    camera.x -= cameraSpeed;
  } else if (player.x > camera.x + camera.width * 0.75) {
    camera.x += cameraSpeed;
  }
  if (player.y < camera.y + camera.height * 0.25) {
    camera.y -= cameraSpeed;
  } else if (player.y > camera.y + camera.height * 0.75) {
    camera.y += cameraSpeed;
  }

  // Clamp camera position within canvas boundaries
  camera.x = Math.max(0, Math.min(camera.x, canvas.width - camera.width));
  camera.y = Math.max(0, Math.min(camera.y, canvas.height - camera.height));

  // Player Speed Boost
  player.isSpeedBoosted = keys.shift;
  player.speed = player.isSpeedBoosted ? player.speedBoost : 1.5;

  // Player Boundaries
  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

 // NPC Movement
 npc.x += npc.dx * npc.speed;
 npc.y += npc.dy * npc.speed;

 // Random Direction Change
 if (Math.random() < 0.01) {
   npc.dx = Math.random() * 2 - 1;
   npc.dy = Math.random() * 2 - 1;
 }

 // Avoidance Behavior
 const avoidanceThreshold = 100;

 // Avoid the player
 const dx = player.x - npc.x;
 const dy = player.y - npc.y;
 const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);

 if (distanceToPlayer < avoidanceThreshold) {
   const angle = Math.atan2(dy, dx);
   npc.dx = -Math.cos(angle);
   npc.dy = -Math.sin(angle);
 }

 // Avoid zombie NPCs
 zombies.forEach(zombie => {
   const dx = zombie.x - npc.x;
   const dy = zombie.y - npc.y;
   const distanceToZombie = Math.sqrt(dx * dx + dy * dy);

   if (distanceToZombie < avoidanceThreshold) {
     const angle = Math.atan2(dy, dx);
     npc.dx = -Math.cos(angle);
     npc.dy = -Math.sin(angle);
   }
 });

// NPC Boundaries
if (npc.x <= 0 || npc.x >= canvas.width - npc.size) {
  npc.dx *= -1;
}
if (npc.y <= 0 || npc.y >= canvas.height - npc.size) {
  npc.dy *= -1;
}
   
  // Zombie NPCs Movement
  zombies.forEach((zombie, index) => {
    let targetX, targetY;

    if (mouse.isPressed) {
      targetX = mouse.x;
      targetY = mouse.y;
    } else {
      targetX = player.x;
      targetY = player.y;
    }

    const dx = targetX - zombie.x;
    const dy = targetY - zombie.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > zombieGap) {
      zombie.x += (dx / distance) * zombie.speed;
      zombie.y += (dy / distance) * zombie.speed;
    }

    // Zombie Overlap Prevention
    for (let i = index + 1; i < zombies.length; i++) {
      const otherZombie = zombies[i];
      const dx = zombie.x - otherZombie.x;
      const dy = zombie.y - otherZombie.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = zombie.size / 2 + otherZombie.size / 2;

      if (distance < minDistance) {
        const angle = Math.atan2(dy, dx);
        const overlap = minDistance - distance;
        const overlapX = Math.cos(angle) * overlap;
        const overlapY = Math.sin(angle) * overlap;

        zombie.x += overlapX / 2;
        zombie.y += overlapY / 2;
        otherZombie.x -= overlapX / 2;
        otherZombie.y -= overlapY / 2;
      }
    }
  });

   // Check collision between NPC and player
  if (isColliding(npc, player)) {
    if (zombies.length < maxZombies) {

      zombies.push({
        x: npc.x,
        y: npc.y,
        size: zombieSize,
        speed: zombieSpeed,
        color: 'green',
        armor: zombieArmorUpgradeCount + 1
      });
    }
    score++; // Increase score by 1
    spawnNewNPC();
  }

  // Check collision between NPC and zombie NPCs
  zombies.forEach(zombie => {
    if (isColliding(npc, zombie)) {
      if (zombies.length < maxZombies) {
        zombies.push({
          x: npc.x,
          y: npc.y,
          size: zombieSize,
          speed: zombieSpeed,
          color: 'green',
          armor: zombieArmorUpgradeCount + 1 
        });
      }
      score++; // Increase score by 1
      spawnNewNPC();
    }
  });

   // Spawn Soldier NPC
   if (score >= 100 && soldier === null) {
    soldier = {
      x: Math.random() * (canvas.width - soldierSize),
      y: Math.random() * (canvas.height - soldierSize),
      size: soldierSize,
      speed: soldierSpeed,
      color: 'purple',
      dx: 1,
      dy: 1
    };
  }

  // Soldier NPC Movement
  if (soldier !== null) {
    soldier.x += soldier.dx * soldier.speed;
    soldier.y += soldier.dy * soldier.speed;

    // Random Direction Change
    if (Math.random() < 0.01) {
      soldier.dx = Math.random() * 2 - 1;
      soldier.dy = Math.random() * 2 - 1;
    }

    // Avoidance Behavior
    const avoidanceThreshold = 100;

    // Avoid the player
    const dx = player.x - soldier.x;
    const dy = player.y - soldier.y;
    const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);

    if (distanceToPlayer < avoidanceThreshold) {
      const angle = Math.atan2(dy, dx);
      soldier.dx = -Math.cos(angle);
      soldier.dy = -Math.sin(angle);
    }

    // Avoid zombie NPCs
    zombies.forEach(zombie => {
      const dx = zombie.x - soldier.x;
      const dy = zombie.y - soldier.y;
      const distanceToZombie = Math.sqrt(dx * dx + dy * dy);

      if (distanceToZombie < avoidanceThreshold) {
        const angle = Math.atan2(dy, dx);
        soldier.dx = -Math.cos(angle);
        soldier.dy = -Math.sin(angle);
      }
    });

    // Soldier NPC Boundaries
    if (soldier !== null) {
      if (soldier.x <= 0 || soldier.x >= canvas.width - soldier.size) {
        soldier.dx *= -1;
      }
      if (soldier.y <= 0 || soldier.y >= canvas.height - soldier.size) {
        soldier.dy *= -1;
      }
    }

   // Soldier NPC Shooting
    soldierFireTimer++;
    if (soldierFireTimer >= soldierFireRate && soldierProjectile === null) {
      // Find the nearest target (player or zombie)
      let nearestTarget = null;
      let nearestDistance = Infinity;

      // Check distance to player
      const playerDx = player.x - soldier.x;
      const playerDy = player.y - soldier.y;
      const distanceToPlayer = Math.sqrt(playerDx * playerDx + playerDy * playerDy);
      if (distanceToPlayer < nearestDistance) {
        nearestTarget = player;
        nearestDistance = distanceToPlayer;
      }

      // Check distance to zombies
      zombies.forEach(zombie => {
        const zombieDx = zombie.x - soldier.x;
        const zombieDy = zombie.y - soldier.y;
        const distanceToZombie = Math.sqrt(zombieDx * zombieDx + zombieDy * zombieDy);
        if (distanceToZombie < nearestDistance) {
          nearestTarget = zombie;
          nearestDistance = distanceToZombie;
        }
      });

      // Shoot at the nearest target if within range
      if (nearestTarget !== null && nearestDistance < 300) {
        const angle = Math.atan2(nearestTarget.y - soldier.y, nearestTarget.x - soldier.x);
        soldierProjectile = {
          x: soldier.x + soldier.size / 2,
          y: soldier.y + soldier.size / 2,
          dx: Math.cos(angle),
          dy: Math.sin(angle)
        };
      

      }

      soldierFireTimer = 0;
    }

    
  // Check collision between soldier projectile and zombie NPCs
  if (soldierProjectile !== null) {
    zombies.forEach((zombie, index) => {
      if (isCollidingWithProjectile(zombie, soldierProjectile)) {
        zombie.armor--;
        soldierProjectile = null; // Move this line outside the if block
        if (zombie.armor <= 0) {
          // Remove the zombie NPC
          zombies.splice(index, 1);
        }
      }
    });
  }

    // Check collision between soldier and player
    if (isColliding(soldier, player)) {
      if (zombies.length < maxZombies) {
        zombies.push({
          x: npc.x,
          y: npc.y,
          size: zombieSize,
          speed: zombieSpeed,
          color: 'green',
          armor: zombieArmorUpgradeCount + 1 
        });
      }
      soldier.shouldRemove = true;
    }

    // Check collision between soldier and zombie NPCs
    zombies.forEach(zombie => {
      if (isColliding(soldier, zombie)) {
        if (zombies.length < maxZombies) {
          zombies.push({
            x: soldier.x,
            y: soldier.y,
            size: zombieSize,
            speed: zombieSpeed,
            color: 'green'
          });
        }
        soldier.shouldRemove = true;
      }
    });

    // Remove soldier if shouldRemove is true
    if (soldier !== null && soldier.shouldRemove) {
      
      soldier = null;
    }
  }

  // Update Soldier Projectile
  if (soldierProjectile !== null) {
    soldierProjectile.x += soldierProjectile.dx * projectileSpeed;
    soldierProjectile.y += soldierProjectile.dy * projectileSpeed;

    // Remove projectile if it goes off-screen
    if (
      soldierProjectile.x < 0 ||
      soldierProjectile.x > canvas.width ||
      soldierProjectile.y < 0 ||
      soldierProjectile.y > canvas.height
    ) {
      soldierProjectile = null;
    }
  }
}

// Render Function
function render() {
  // Clear Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw objects relative to the camera position
  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // Draw NPC
  ctx.beginPath();
  ctx.arc(npc.x + npc.size / 2, npc.y + npc.size / 2, npc.size / 2, 0, 2 * Math.PI);
  ctx.fillStyle = npc.color;
  ctx.fill();
  ctx.closePath();

  // Draw Zombie NPCs
  zombies.forEach(zombie => {
    ctx.beginPath();
    ctx.arc(zombie.x + zombie.size / 2, zombie.y + zombie.size / 2, zombie.size / 2, 0, 2 * Math.PI);
    ctx.fillStyle = zombie.color;
    ctx.fill();
    ctx.closePath();
  });

  // Draw Player
  ctx.save();
  ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
  ctx.rotate(player.angle);
  ctx.drawImage(playerImage, -player.size / 2, -player.size / 2, player.size, player.size);
  ctx.restore();

  // Draw Soldier NPC
  if (soldier !== null) {
    ctx.beginPath();
    ctx.arc(soldier.x + soldier.size / 2, soldier.y + soldier.size / 2, soldier.size / 2, 0, 2 * Math.PI);
    ctx.fillStyle = soldier.color;
    ctx.fill();
    ctx.closePath();
  }

  // Draw Soldier Projectile
  if (soldierProjectile !== null) {
    ctx.beginPath();
    ctx.arc(soldierProjectile.x, soldierProjectile.y, projectileSize, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.closePath();
  }

  ctx.restore();

  // Draw Score
  ctx.font = '24px Arial';
  ctx.fillStyle = 'black';
  ctx.fillText(`Score: ${score}`, 10, 30);

  // Draw Max Zombies
  ctx.font = '24px Arial';
  ctx.fillStyle = 'black';
  ctx.fillText(`Max Zombies: ${maxZombies}`, 10, 60);

   // Draw Soldier NPC
  if (soldier !== null) {
    ctx.beginPath();
    ctx.arc(soldier.x + soldier.size / 2, soldier.y + soldier.size / 2, soldier.size / 2, 0, 2 * Math.PI);
    ctx.fillStyle = soldier.color;
    ctx.fill();
    ctx.closePath();
  }

  // Draw Soldier Projectile
  if (soldierProjectile !== null) {
    ctx.beginPath();
    ctx.arc(soldierProjectile.x, soldierProjectile.y, projectileSize, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.closePath();
  }

}

// Game Loop
function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

// Start Game
gameLoop();

// Event Handler Functions
function handleKeyDown(event) {
  if (event.code === 'ArrowUp' || event.code === 'KeyW') keys.up = true;
  if (event.code === 'ArrowDown' || event.code === 'KeyS') keys.down = true;
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') keys.left = true;
  if (event.code === 'ArrowRight' || event.code === 'KeyD') keys.right = true;
  if (event.code === 'ShiftLeft') keys.shift = true;
}

function handleKeyUp(event) {
  if (event.code === 'ArrowUp' || event.code === 'KeyW') keys.up = false;
  if (event.code === 'ArrowDown' || event.code === 'KeyS') keys.down = false;
  if (event.code === 'ArrowLeft' || event.code === 'KeyA') keys.left = false;
  if (event.code === 'ArrowRight' || event.code === 'KeyD') keys.right = false;
  if (event.code === 'ShiftLeft') keys.shift = false;
}

function handleMouseMove(event) {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
  const angle = Math.atan2(event.clientY - player.y, event.clientX - player.x);
  player.angle = angle;
}

function handleMouseDown(event) {
  mouse.isPressed = true;
}

function handleMouseUp(event) {
  mouse.isPressed = false;
}

// Helper Functions
function isColliding(obj1, obj2) {
  const dx = obj1.x - obj2.x;
  const dy = obj1.y - obj2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDistance = obj1.size / 2 + obj2.size / 2;
  return distance < minDistance;
}


function isCollidingWithProjectile(obj, projectile) {
  const dx = obj.x - projectile.x;
  const dy = obj.y - projectile.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDistance = obj.size / 2 + projectileSize;
  return distance < minDistance;
}



function spawnNewNPC() {
  npc = {
    x: Math.random() * (canvas.width - npc.size),
    y: Math.random() * (canvas.height - npc.size),
    size: 50,
    speed: 1,
    color: 'blue',
    dx: 1,
    dy: 1
  };
}


// Store Setup
const storeButton = document.getElementById('storeButton');
const storeMenu = document.createElement('div');
storeMenu.id = 'storeMenu';
document.body.appendChild(storeMenu);

let maxZombiesUpgradeCost = 20;
let maxZombiesUpgradeCount = 0;

storeButton.addEventListener('click', toggleStoreMenu);

function toggleStoreMenu() {
  if (storeMenu.style.display === 'none') {
    storeMenu.style.display = 'block';
    updateStoreMenu();
  } else {
    storeMenu.style.display = 'none';
  }
}

function upgradeMaxZombies() {
  if (score >= maxZombiesUpgradeCost) {
    score -= maxZombiesUpgradeCost;
    maxZombies++;
    maxZombiesUpgradeCount++;
    maxZombiesUpgradeCost += 10;
    updateStoreMenu();
  }
}

function updateStoreMenu() {
  storeMenu.innerHTML = `
    <h2>Store</h2>
    <p>Score: ${score}</p>
    <p>Increase Max Zombies (${maxZombiesUpgradeCost} points)</p>
    <button id="maxZombiesUpgrade">Upgrade</button>
    <p>Increase Zombie Speed (${zombieSpeedUpgradeCost} points)</p>
    <button id="zombieSpeedUpgrade">Upgrade</button>
    <p>Increase Zombie Armor (${zombieArmorUpgradeCost} points)</p>
    <button id="zombieArmorUpgrade" ${zombieArmorUpgradeCount === maxZombieArmorUpgrades ? 'disabled' : ''}>Upgrade</button>
  `;

  const maxZombiesUpgradeButton = document.getElementById('maxZombiesUpgrade');
  maxZombiesUpgradeButton.addEventListener('click', upgradeMaxZombies);

  const zombieSpeedUpgradeButton = document.getElementById('zombieSpeedUpgrade');
  zombieSpeedUpgradeButton.addEventListener('click', upgradeZombieSpeed);

  const zombieArmorUpgradeButton = document.getElementById('zombieArmorUpgrade');
  zombieArmorUpgradeButton.addEventListener('click', upgradeZombieArmor);
}

function upgradeZombieSpeed() {
  if (score >= zombieSpeedUpgradeCost) {
    score -= zombieSpeedUpgradeCost;
    zombieSpeed += 0.1; // Increase base zombie speed by 0.1
    zombieSpeedUpgradeCount++;
    zombieSpeedUpgradeCost += 10;

    // Update the speed of all existing zombie NPCs
    zombies.forEach(zombie => {
      zombie.speed = zombieSpeed;
    });

    updateStoreMenu();
  }
}


function upgradeZombieArmor() {
  if (score >= zombieArmorUpgradeCost && zombieArmorUpgradeCount < maxZombieArmorUpgrades) {
    score -= zombieArmorUpgradeCost;
    zombieArmorUpgradeCount++;

    // Update the armor of all existing zombie NPCs
    zombies.forEach(zombie => {
      zombie.armor = zombieArmorUpgradeCount + 1; // Change this line
    });

    updateStoreMenu();
  }
}
