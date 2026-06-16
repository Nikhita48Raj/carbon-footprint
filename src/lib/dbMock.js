import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const DB_PATH = path.join(process.cwd(), 'db.json');

async function readDB() {
  try {
    const content = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    const initialData = { users: [], activities: [], goals: [] };
    await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
}

async function writeDB(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

function decorateUser(user) {
  if (!user) return null;
  return {
    ...user,
    comparePassword: async function (candidate) {
      return bcrypt.compare(candidate, this.password);
    },
    save: async function () {
      const db = await readDB();
      const idx = db.users.findIndex((u) => u._id.toString() === this._id.toString());
      if (idx !== -1) {
        db.users[idx] = {
          ...db.users[idx],
          name: this.name,
          email: this.email,
          profile: this.profile,
          baseline: this.baseline,
          gamification: this.gamification,
          updatedAt: new Date().toISOString()
        };
        await writeDB(db);
      }
      return this;
    }
  };
}

function decorateGoal(goal) {
  if (!goal) return null;
  return {
    ...goal,
    save: async function () {
      const db = await readDB();
      const idx = db.goals.findIndex((g) => g._id.toString() === this._id.toString());
      if (idx !== -1) {
        db.goals[idx] = {
          ...db.goals[idx],
          currentValue: this.currentValue,
          status: this.status,
          completedAt: this.completedAt,
          milestones: this.milestones,
          updatedAt: new Date().toISOString()
        };
        await writeDB(db);
      }
      return this;
    }
  };
}

export const MockUser = {
  findOne: (query) => {
    const getDecorated = async () => {
      const db = await readDB();
      let found = null;
      if (query.email) {
        found = db.users.find((u) => u.email.toLowerCase() === query.email.toLowerCase());
      }
      return decorateUser(found);
    };

    const promise = getDecorated();
    return {
      select: function (fields) {
        return promise;
      },
      then: function (onFulfilled, onRejected) {
        return promise.then(onFulfilled, onRejected);
      }
    };
  },

  findById: async (id) => {
    const db = await readDB();
    const found = db.users.find((u) => u._id.toString() === id.toString());
    return decorateUser(found);
  },

  findByIdAndUpdate: async (id, update, options) => {
    const db = await readDB();
    const idx = db.users.findIndex((u) => u._id.toString() === id.toString());
    if (idx === -1) return null;

    const user = db.users[idx];
    if (update.$set) {
      for (const key in update.$set) {
        if (key.includes('.')) {
          const parts = key.split('.');
          let current = user;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {};
            current = current[parts[i]];
          }
          current[parts[parts.length - 1]] = update.$set[key];
        } else {
          user[key] = update.$set[key];
        }
      }
    }
    user.updatedAt = new Date().toISOString();
    await writeDB(db);
    return decorateUser(user);
  },

  create: async (data) => {
    const db = await readDB();
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = {
      _id: crypto.randomUUID(),
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      profile: {
        onboardingComplete: false,
        location: '',
        country: '',
        householdSize: 1,
        diet: 'avg_meat',
        transportMode: 'car_petrol',
        energySource: 'grid'
      },
      baseline: { annualKgCO2e: 0, calculatedAt: null },
      gamification: { level: 1, streakDays: 0, totalPoints: 0, badges: [] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.users.push(newUser);
    await writeDB(db);
    return decorateUser(newUser);
  }
};

export const MockActivityLog = {
  find: async (query) => {
    const db = await readDB();
    let logs = db.activities.filter((a) => a.userId.toString() === query.userId.toString());
    if (query.loggedAt && query.loggedAt.$gte) {
      const minDate = new Date(query.loggedAt.$gte);
      logs = logs.filter((a) => new Date(a.loggedAt) >= minDate);
    }
    if (query.loggedAt && query.loggedAt.$lte) {
      const maxDate = new Date(query.loggedAt.$lte);
      logs = logs.filter((a) => new Date(a.loggedAt) <= maxDate);
    }
    if (query.category) {
      logs = logs.filter((a) => a.category === query.category);
    }
    return logs.sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));
  },

  create: async (data) => {
    const db = await readDB();
    const newLog = {
      _id: crypto.randomUUID(),
      ...data,
      loggedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.activities.push(newLog);
    await writeDB(db);
    return newLog;
  }
};

export const MockGoal = {
  find: async (query) => {
    const db = await readDB();
    let goals = db.goals.filter((g) => g.userId.toString() === query.userId.toString());
    if (query.status) {
      goals = goals.filter((g) => g.status === query.status);
    }
    
    // Sort logic
    const sorted = goals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return sorted.map(g => decorateGoal(g));
  },

  create: async (data) => {
    const db = await readDB();
    const newGoal = {
      _id: crypto.randomUUID(),
      ...data,
      currentValue: data.currentValue ?? 0,
      status: data.status ?? 'active',
      startDate: data.startDate ?? new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.goals.push(newGoal);
    await writeDB(db);
    return decorateGoal(newGoal);
  }
};
