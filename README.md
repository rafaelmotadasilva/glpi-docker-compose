# GLPI com Docker Compose

Este projeto fornece uma instância do GLPI (Gestão Livre de Parque de Informática) em um ambiente Dockerizado, incluindo um servidor MariaDB.

## Visão Geral

O GLPI é uma solução de software livre para gerenciamento de recursos de TI e atendimento ao cliente. Este projeto fornece uma maneira fácil de implantar o GLPI em um ambiente Docker, permitindo rápida configuração e escalabilidade.

## Requisitos

* Docker Compose

## Instruções

1. [Clone o repositório](#clone-o-repositório)
2. [Navegue até o diretório do projeto](#navegue-até-o-diretório-do-projeto)
3. [Crie a imagem do GLPI](#crie-a-imagem-do-glpi)
4. [Inicie os serviços](#inicie-os-serviços)
5. [Acesse o GLPI](#acesse-o-glpi)
8. [Conclusão](#conclusão)

## Clone o repositório

```
git clone https://github.com/rafaelmotadasilva/glpi-docker.git
```

## Navegue até o diretório do projeto

```
cd glpi-docker
```

## Crie a imagem do GLPI

```
sudo docker build -t glpi:1.0.0 .
```

## Inicie os serviços

```
sudo docker-compose up -d
```

## Acesse o GLPI

Abra seu navegador e acesse http://host. Você será redirecionado para a página de instalação do GLPI. Siga as instruções para concluir a instalação.

## Conclusão

Após seguir os passos acima, você terá o GLPI instalado e funcionando em um ambiente Dockerizado.

## Contribuição

Se você tiver sugestões de melhorias ou correções para este guia, sinta-se à vontade para enviar uma pull request.

## Referências

- [Documentação oficial de instalação do GLPI](https://glpi-install.readthedocs.io/pt/latest/)
- [Documentação oficial do Docker - Como criar um Dockerfile](https://docs.docker.com/engine/reference/builder/)
- [Documentação oficial do Docker - Docker Compose File v3](https://docs.docker.com/compose/compose-file/compose-file-v3/)
- [Documentação oficial do Ubuntu - Docker para administradores de sistema](https://ubuntu.com/server/docs/docker-for-system-admins)

## Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).
