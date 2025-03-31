<script setup>
import { ref } from "vue";

const activated = ref(false);
let ob = null;
let yb = null;
let g = null;
let team_count = null;
let teams = ref([]);

//팀 빌딩 함수
const makeTeam = async () => {
    activated.value = true;

    const text = await readSettings();
    getGroup(text);

    const first = yb.length >= ob.length ? yb : ob;
    const last = yb.length >= ob.length ? ob : yb;

    pickTeamMember(first); //1. yb, ob 중 인원 많은 그룹에서 채우기
    pickTeamMember(g); //2. 여성 채우기
    equalizeTeams(last); //3. 가장 인원 많은 팀의 인원 수와 같아질 때 까지 yb, ob 중 인원 적은 그룹에서 역방향으로 채우기
    pickTeamMember(last, false); //4. 나머지 인원을 역방향으로 채우기

    console.log("teams:", teams);
};

//텍스트 파일 read 함수
const readSettings = async () => {
    try {
        const response = await fetch("/resources/members.txt");
        if (!response.ok) throw new Error("파일 읽기 실패");

        const text = await response.text();

        return text;
    } catch (error) {
        console.error(error);
        return null;
    }
};

//읽은 텍스트 -> 그룹 변환
const getGroup = (text) => {
    if (!text) {
        console.error("파일 읽기 실패");
        return;
    }

    const obMatch = text.match(/\[OB\]\s*([\s\S]*?)\s*\[YB\]/);
    const ybMatch = text.match(/\[YB\]\s*([\s\S]*?)\s*\[G\]/);
    const gMatch = text.match(/\[G\]\s*([\s\S]*?)\s*\[TEAMS\]/);
    const teamCountMatch = text.match(/\[TEAMS\]\s*(\d+)/);

    ob = obMatch ? obMatch[1].trim().split(/\s+/) : [];
    yb = ybMatch ? ybMatch[1].trim().split(/\s+/) : [];
    g = gMatch ? gMatch[1].trim().split(/\s+/) : [];
    team_count = teamCountMatch ? parseInt(teamCountMatch[1]) : null;

    teams.value = Array.from({ length: team_count }, () => []);
};

//그룹에서 사람을 뽑아 팀에 넣는 함수
const pickTeamMember = (group, forward) => {
    let count = 0;
    while (group.length > 0) {
        // 팀을 채울 순서를 결정 - forward가 true는 0부터, false는 마지막 팀부터
        const teamIndex = forward
            ? count % team_count
            : team_count - 1 - (count % team_count);

        const groupMemberIndex = getRandomInt(0, group.length);

        teams.value[teamIndex].push(group[groupMemberIndex]);
        group.splice(groupMemberIndex, 1);

        count++;
    }
};

//난수 뽑기
const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min) + min);
};

//마지막 그룹 뽑기 전 인원 균등하게 처리
const equalizeTeams = (group) => {
    const maxMemberLength = Math.max(...teams.value.map((arr) => arr.length));

    let teamIndex = teams.value.length - 1;
    while (
        !teams.value.every((team) => team.length === maxMemberLength) &&
        group.length > 0
    ) {
        if (teams.value[teamIndex].length >= maxMemberLength) {
            teamIndex--;

            if (teamIndex < 0) {
                teamIndex = teams.value.length - 1;
            }
            continue;
        }

        const memberIndex = getRandomInt(0, group.length);
        teams.value[teamIndex].push(group[memberIndex]);
        group.splice(memberIndex, 1);
    }
};

const saveAsTxt = () => {
    let content = "";

    teams.value.forEach((team, index) => {
        content += `[Team${index + 1}]\n`;
        content += team.join(", ") + "\n\n";
    });

    const blob = new Blob([content], { type: "text/plain" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "팀빌딩결과.txt";

    link.click();
};
</script>

<template>
    <div id="wrapper">
        <div id="header">
            <img class="logo" src="/resources/logo.png" />
            <h2>GMISSION 2025 워크샵 팀 빌딩</h2>
            <h3>2025-04-11 ~ 2025-04-12</h3>
        </div>
        <div>
            <div class="content">
                <button class="btn" v-on:click="makeTeam">생성</button>
            </div>
            <div class="content" v-if="activated">
                <div>
                    <div id="result-container">
                        <div
                            v-for="(team, index) in teams"
                            :key="index"
                            class="team"
                        >
                            <h3>Team {{ index + 1 }}</h3>
                            <p v-for="(member, i) in team" :key="i">
                                {{ member }}
                            </p>
                        </div>
                    </div>
                </div>
                <div id="save">
                    <button class="btn" v-on:click="saveAsTxt">
                        결과 저장
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
#wrapper {
    width: 100%;
    padding-top: 1em;
    padding-bottom: 1em;
    background-color: #72a4dd;
}

#header {
    margin: 0;
    width: 100%;
    color: white;
}

#header > h2,
h3 {
    margin: 0.5em;
}

.content {
    margin-top: 1em;
    margin-bottom: 1em;
    padding-bottom: 1em;
}

.logo {
    height: 200px;
}

@keyframes shake {
    0% {
        transform: rotate(0);
    }
    25% {
        transform: rotate(-5deg);
    }
    50% {
        transform: rotate(5deg);
    }
    75% {
        transform: rotate(-5deg);
    }
    100% {
        transform: rotate(0);
    }
}

.btn {
    border: 2px solid #0d55a6;
    font-weight: bold;
    color: #0d55a6;
    transition: transform 0.1s ease-in-out;
}

.btn:focus {
    outline: none;
}

.btn:hover {
    border: 2px solid #12aebb;
    color: #12aebb;
}

.btn:active {
    border: 2px solid red;
    color: red;
    animation: shake 0.1s ease-in-out;
}

#result-container {
    margin-top: 1em;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
}

.team {
    width: 22%;
    min-width: 150px;
    background-color: white;
    padding: 10px;
    border-radius: 10px;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
}

#save {
    margin-top: 1em;
}

li {
    list-style-type: none;
}
</style>
