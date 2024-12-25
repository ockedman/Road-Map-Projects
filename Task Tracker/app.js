class Task {

    constructor(id, desc, status, createdAt, updatedAt) {
        this.id = id;
        this.desc = desc;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

class CLI {
    
    constructor() {

        const fs = require("fs");
        const filePath = "./data.json";
        
        this.fs = fs;
        this.filePath = filePath;
        
        // const menu = document.getElementById("menu");
        const menu = `Here are the commands:\n\n` +
            `   add insert-task;\n\n` +
            `   update id-task insert-task;\n\n` +
            `   delete id-task;\n\n` +
            `   mark-in-progress id-task;\n\n` +
            `   mark-done id-task;\n\n` +
            `   list;\n\n` +
            `   list done;\n\n` +
            `   list todo;\n\n` +
            `   list in-progress;\n\n` +
            `   close;\n\n` +
            `   help\n`;
        this.menu = menu;
        console.log(menu);
    };

    async readJSON() {
        try {            
            const directoryPath = './'; // Répertoire courant

            this.fs.readdir(directoryPath, (err, files) => {
                if (err) {
                    console.error("Erreur lors de la lecture du répertoire :", err);
                    return;
                }
            });

            if (!this.fs.existsSync(this.filePath)) {
                try {
                    const base = {"tasks": []};
                    this.fs.writeFileSync(this.filePath, JSON.stringify(base, null, 2));
                } catch (err) {
                    console.error("error when creating file:", err);
                }
            }
 
            const data = await this.fs.promises.readFile(this.filePath, 'utf8', (err, info) => {console.log("we read the info:", info)});
            return data;
        } catch (err) {
            console.error("error reading file:", err);
        }
    };

    async getData() {
        const file = await this.readJSON();
        const j_data = JSON.parse(file);
        this.nb_tasks = j_data["tasks"].length;
        return j_data;
    }

    writeData(j_data) {
        const j_file = JSON.stringify(j_data, null, 2);
        this.fs.writeFileSync(this.filePath, j_file);
    }

    findTask(j_data, id) {
        const num = Number(id);
        if (isNaN(num)) {
            console.log(id, "is not a valid id.\n");
            return [false, null];
        };

        if (j_data["tasks"].length < id) {
            console.log("There's no task of id", id);
            console.log(this.menu);
            return [false, null];
        }
        return [true, j_data["tasks"][id-1]];
    }

    async add(t) {
        try {
            if (t == "") {
                console.log("No task present.\n");
                return;
            }
            
            const j_data = await this.getData();
            
            this.nb_tasks += 1;

            const new_t = new Task(this.nb_tasks, t, "todo", new Date(), new Date());
            j_data["tasks"].push(new_t);
    
            this.writeData(j_data);
        } catch(err) {
            console.error(err);
        }
    };

    async update(id, t) {
        const j_data = await this.getData();
        const [b, task] = this.findTask(j_data, id);
        
        if (b) {
            task["desc"] = t;
            task["updatedAt"] = new Date();
            this.writeData(j_data);
        };
    }

    async delete(id) {
        const j_data = await this.getData();
        const [b, _] = this.findTask(j_data, id);

        if (b) {
            this.nb_tasks -= 1;
            j_data["tasks"].splice(id-1, 1);

            j_data["tasks"].slice(id-1).forEach(task => {
                task["id"] -= 1;
            });

            this.writeData(j_data);
        }
    }

    async mark_in_progress(id) {
        const j_data = await this.getData();
        const [b, task] = this.findTask(j_data, id);

        if (b) {
            task["status"] = "in progress";
            this.writeData(j_data);
        }
    }

    async mark_done(id) {
        const j_data = await this.getData();
        const [b, task] = this.findTask(j_data, id);

        if (b) {
            task["status"] = "done";
            this.writeData(j_data);
        }
    }

    async list(mode) {
        try {
            const possible_modes = ["", "todo", "done", "in-progress"];
            const b = possible_modes.includes(mode);
            if (!b) {
                console.log(mode, "is not a valid mode for list.");
                return;
            };

            const j_data = await this.getData();

            let to_list = j_data["tasks"];

            if (mode != "") {
                to_list = to_list.filter(task => task["status"] == mode);
            }

            if (to_list.length == 0) {
                console.log("We have no tasks", mode);
                return;
            }

            console.log("Here are our tasks:\n\n");
            
            to_list.forEach(task => {
                const txt = `Task number ${task.id}\n` + 
                    `   - description: ${task.desc}\n` +
                    `   - status: ${task.status}\n` +
                    `   - created: ${task.createdAt}\n` +
                    `   - last updated: ${task.updatedAt}\n`;
                
                console.log(txt);
            });
        } catch (err) {
            console.error(err);
        }
    }

    async readCommand(answer) {
        try {
            const args = answer.split(" ");
            // console.log(args);

            if (args[0] != "list" && args[0] != "close" && args[0] != "help" && args.length < 2) {
                console.log("Argument missing.\n");
                console.log(this.menu);
                return true;
            }

            switch(args[0]) {
                case "add":
                    await this.add(args.slice(1).join(" "));
                    return true;

                case "update":
                    await this.update(args[1], args[2]);
                    return true;

                case "delete":
                    await this.delete(args[1]);
                    return true;

                case "mark-in-progress":
                    await this.mark_in_progress(args[1]);
                    return true;

                case "mark-done":
                    await this.mark_done(args[1]);
                    return true;

                case "list":
                    if (args.length > 1) {
                        await this.list(args[1]);
                    }
                    else {
                        await this.list("");
                    }
                    return true;

                case "close":
                    return false;

                case "help":
                    console.log(this.menu);
                    return true;
                
                default:
                    console.log("Command doesn't exist. Here are the existing ones:\n");
                    console.log(this.menu);
                    return true;
            }
        } catch(err) {
            console.error("didn't read command well:", err);
        }
    }

    execute() {
        const readline = require("readline");
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question("Enter a task : ", async (answer) => {
            try {
                const next = await this.readCommand(answer);
                rl.close();
                if (next) this.execute();
                else return;
            } catch(err) {
                console.error(err);
            }
        });
    }
}


const manager = new CLI();
manager.execute();