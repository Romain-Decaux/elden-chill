📜 Document de Game Design : Elden Chill

1. Vision Globale

Un RPG d'expédition sur navigateur alliant l'atmosphère sombre et l'exigence d'Elden Ring à une boucle de progression incrémentale satisfaisante. Le jeu se concentre sur la gestion des risques, l'optimisation d'un "build" minimaliste et la collection d'équipement. 2. La Boucle de Gameplay (Core Loop)

    Préparation (Menu/Camp) : Le joueur équipe jusqu'à 3 objets et dépense ses runes sécurisées pour augmenter ses statistiques.

    Expédition (Biome) : Le personnage progresse automatiquement à travers une série de combats.

    Gestion du Risque : Entre les combats, des feux de camp permettent de s'arrêter pour sécuriser les runes acquises.

    Confrontation : Un mini-boss conclut le biome. Sa défaite garantit un loot d'équipement.

    Retour : En cas de victoire ou de repli volontaire, les runes sont sauvées. En cas de défaite, les runes "portées" sont perdues.

3.  Système de Progression & Statistiques

    Progression Lente : Le gain de puissance est volontairement progressif pour valoriser chaque palier atteint.

    Statistiques de Base :

        Vigueur : Augmente les points de vie (capacité à encaisser les monstres).

        Force : Augmente les dégâts physiques de base.

    Économie : Les runes servent exclusivement à l'achat de statistiques au menu principal.

4.  Mécanique d'Équipement (Le "Loot")

    Limitation : 3 slots maximum actifs. Le joueur doit faire des choix cornéliens entre attaque et survie.

    Système d'Amélioration (Stacking) :

        Le niveau d'un objet définit la difficulté de son prochain palier.

        Pour passer au niveau L+1, le joueur doit looter l'objet L fois supplémentaires.

        Exemple : Une épée de Niveau 3 nécessite de trouver 3 copies de cette même épée pour devenir Niveau 4.

        Formule de progression :
        Copies requises pour (L→L+1)=L

5.  Structure du Monde (Biomes)
    Type d'étape Description Risque / Récompense
    Monstres mineurs Combats simples pour accumuler des runes. Risque faible / Gain régulier.
    Feu de camp Point de décision : Sécuriser les runes et rentrer, ou continuer. Sécurité totale.
    Mini-Boss Ennemi puissant à la fin de chaque biome. Risque de mort élevé / Drop d'objet garanti.
6.  Aspect Technique (Stack Moderne)

    Langage : JavaScript (ES6+).

    Interface : HTML5 / CSS3 (Thème Dark/Gothique).

    Sauvegarde : LocalStorage avec sérialisation JSON pour une persistance sur le PC de l'utilisateur.
